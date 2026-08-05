import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import { writeAuditLog } from "@/lib/audit";
import { listBackupFiles, getBackupFilePath } from "@/lib/backupService";

export type IntegrityIssue = {
  type: string;
  severity: "warning" | "error" | "info";
  message: string;
  count: number;
  sampleIds?: string[];
};

async function push(
  issues: IntegrityIssue[],
  issue: IntegrityIssue,
) {
  if (issue.count > 0) issues.push(issue);
}

/** Verificação enterprise de integridade */
export async function runIntegrityCheck(opts?: { user?: string }) {
  const t0 = Date.now();
  await writeAuditLog("Integridade iniciada", "Verificação completa", {
    user: opts?.user || "Sistema",
  });

  const issues: IntegrityIssue[] = [];

  try {
    // PostgreSQL + Prisma
    await prisma.$queryRaw`SELECT 1`;
    await push(issues, {
      type: "postgresql",
      severity: "info",
      message: "PostgreSQL conectado",
      count: 0,
    });

    // Foreign keys — produtos sem categoria
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        categoryId: true,
        name: true,
        image: true,
        gallery: true,
        stock: true,
      },
    });
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
    });
    const catIds = new Set(categories.map((c) => c.id));

    await push(issues, {
      type: "products_without_category",
      severity: "error",
      message: "Produtos sem categoria válida",
      count: products.filter((p) => !catIds.has(p.categoryId)).length,
      sampleIds: products
        .filter((p) => !catIds.has(p.categoryId))
        .slice(0, 10)
        .map((p) => p.id),
    });

    // Produtos sem imagens
    await push(issues, {
      type: "products_without_images",
      severity: "warning",
      message: "Produtos sem imagem",
      count: products.filter((p) => !p.image).length,
      sampleIds: products.filter((p) => !p.image).slice(0, 10).map((p) => p.id),
    });

    // Categorias vazias
    const productCountByCat = new Map<string, number>();
    for (const p of products) {
      productCountByCat.set(
        p.categoryId,
        (productCountByCat.get(p.categoryId) || 0) + 1,
      );
    }
    const emptyCats = categories.filter((c) => !productCountByCat.get(c.id));
    await push(issues, {
      type: "empty_categories",
      severity: "info",
      message: "Categorias sem produtos",
      count: emptyCats.length,
      sampleIds: emptyCats.slice(0, 10).map((c) => c.id),
    });

    // Estoque negativo
    await push(issues, {
      type: "negative_stock",
      severity: "error",
      message: "Produtos com estoque negativo",
      count: products.filter((p) => p.stock < 0).length,
      sampleIds: products.filter((p) => p.stock < 0).slice(0, 10).map((p) => p.id),
    });

    // Clientes: e-mails / CPF duplicados (além do unique constraint — soft check)
    const dupEmails = await prisma.$queryRaw<
      Array<{ email: string; c: bigint }>
    >`SELECT lower(email) as email, COUNT(*)::bigint as c FROM customers GROUP BY lower(email) HAVING COUNT(*) > 1 LIMIT 20`;
    await push(issues, {
      type: "duplicate_customer_emails",
      severity: "warning",
      message: "E-mails de clientes duplicados",
      count: dupEmails.length,
      sampleIds: dupEmails.map((d) => d.email),
    });

    const dupCpf = await prisma.$queryRaw<
      Array<{ cpf: string; c: bigint }>
    >`SELECT cpf, COUNT(*)::bigint as c FROM customers WHERE cpf <> '' GROUP BY cpf HAVING COUNT(*) > 1 LIMIT 20`;
    await push(issues, {
      type: "duplicate_cpf",
      severity: "error",
      message: "CPFs duplicados",
      count: dupCpf.length,
      sampleIds: dupCpf.map((d) => d.cpf),
    });

    const dupCnpj = await prisma.$queryRaw<
      Array<{ cnpj: string; c: bigint }>
    >`SELECT cnpj, COUNT(*)::bigint as c FROM dealers WHERE cnpj <> '' GROUP BY cnpj HAVING COUNT(*) > 1 LIMIT 20`;
    await push(issues, {
      type: "duplicate_cnpj",
      severity: "error",
      message: "CNPJs duplicados (revendedores)",
      count: dupCnpj.length,
      sampleIds: dupCnpj.map((d) => d.cnpj),
    });

    // Pedidos inconsistentes
    const emptyOrders = await prisma.order.findMany({
      where: { items: { none: {} } },
      select: { id: true },
      take: 50,
    });
    await push(issues, {
      type: "orders_without_items",
      severity: "warning",
      message: "Pedidos sem itens",
      count: emptyOrders.length,
      sampleIds: emptyOrders.map((o) => o.id),
    });

    const negOrders = await prisma.order.findMany({
      where: { total: { lt: 0 } },
      select: { id: true },
      take: 20,
    });
    await push(issues, {
      type: "orders_negative_total",
      severity: "error",
      message: "Pedidos com total negativo",
      count: negOrders.length,
      sampleIds: negOrders.map((o) => o.id),
    });

    // Cupons inativos com código vazio
    const badCoupons = await prisma.coupon.findMany({
      where: { OR: [{ code: "" }, { discount: { lt: 0 } }] },
      select: { id: true },
      take: 50,
    });
    await push(issues, {
      type: "invalid_coupons",
      severity: "warning",
      message: "Cupons inválidos (código vazio ou desconto negativo)",
      count: badCoupons.length,
      sampleIds: badCoupons.map((c) => c.id),
    });

    // Sessões órfãs (userId inexistente)
    const sessions = await prisma.adminSession.findMany({
      select: { id: true, userId: true },
      take: 500,
    });
    const adminIds = new Set(
      (await prisma.adminUser.findMany({ select: { id: true } })).map((u) => u.id),
    );
    const orphanSessions = sessions.filter((s) => !adminIds.has(s.userId));
    await push(issues, {
      type: "orphan_sessions",
      severity: "warning",
      message: "Sessões com usuário inexistente",
      count: orphanSessions.length,
      sampleIds: orphanSessions.slice(0, 10).map((s) => s.id),
    });

    // Revendedores inválidos (sem CNPJ)
    const badDealers = await prisma.dealer.findMany({
      where: { OR: [{ cnpj: "" }, { email: "" }] },
      select: { id: true },
      take: 50,
    });
    await push(issues, {
      type: "invalid_dealers",
      severity: "warning",
      message: "Revendedores sem CNPJ ou e-mail",
      count: badDealers.length,
      sampleIds: badDealers.map((d) => d.id),
    });

    // Configurações obrigatórias
    const missingEnv: string[] = [];
    if (!process.env.DATABASE_URL) missingEnv.push("DATABASE_URL");
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.ADMIN_SESSION_SECRET &&
      !process.env.JWT_SECRET
    ) {
      missingEnv.push("ADMIN_SESSION_SECRET");
    }
    await push(issues, {
      type: "missing_env",
      severity: "error",
      message: "Configurações de ambiente obrigatórias ausentes",
      count: missingEnv.length,
      sampleIds: missingEnv,
    });

    // Imagens / uploads
    const uploadRoot = path.join(process.cwd(), "public");
    let missingFiles = 0;
    const sampleMissing: string[] = [];
    for (const p of products.slice(0, 300)) {
      const refs = [p.image, ...(p.gallery || [])].filter(
        (u) => u && String(u).startsWith("/uploads/"),
      );
      for (const ref of refs) {
        try {
          await fs.access(path.join(uploadRoot, String(ref).replace(/^\//, "")));
        } catch {
          missingFiles++;
          if (sampleMissing.length < 10) sampleMissing.push(p.id);
        }
      }
    }
    await push(issues, {
      type: "missing_image_files",
      severity: "warning",
      message: "Arquivos de imagem inexistentes",
      count: missingFiles,
      sampleIds: sampleMissing,
    });

    // Mídias órfãs
    const allProductIds = new Set(
      (await prisma.product.findMany({ select: { id: true } })).map((p) => p.id),
    );
    const media = await prisma.mediaAsset.findMany({
      where: { productId: { not: null } },
      select: { id: true, productId: true, url: true },
      take: 2000,
    });
    const orphanMedia = media.filter(
      (m) => m.productId && !allProductIds.has(m.productId),
    );
    await push(issues, {
      type: "orphan_media",
      severity: "warning",
      message: "Imagens sem produto (mídia órfã)",
      count: orphanMedia.length,
      sampleIds: orphanMedia.slice(0, 10).map((m) => m.id),
    });

    // Integridade dos backups (JSON válido)
    let badBackups = 0;
    const sampleBad: string[] = [];
    try {
      const files = await listBackupFiles();
      for (const f of files.slice(0, 20)) {
        try {
          const raw = await fs.readFile(getBackupFilePath(f.file), "utf8");
          JSON.parse(raw);
        } catch {
          badBackups++;
          if (sampleBad.length < 5) sampleBad.push(f.file);
        }
      }
    } catch {
      /* ignore */
    }
    await push(issues, {
      type: "corrupt_backups",
      severity: "error",
      message: "Backups corrompidos / JSON inválido",
      count: badBackups,
      sampleIds: sampleBad,
    });

    // Índices — consulta information_schema
    const indexCount = await prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*)::bigint as c FROM pg_indexes WHERE schemaname = 'public'
    `.catch(() => [{ c: BigInt(0) }]);
    if (Number(indexCount[0]?.c || 0) < 5) {
      issues.push({
        type: "few_indexes",
        severity: "warning",
        message: "Poucos índices no schema public",
        count: Number(indexCount[0]?.c || 0),
      });
    }

    const realIssues = issues.filter((i) => i.count > 0 && i.severity !== "info");
    const status = realIssues.some((i) => i.severity === "error")
      ? "error"
      : realIssues.length
        ? "warning"
        : "ok";
    const summary =
      status === "ok"
        ? "Sistema saudável — nenhuma inconsistência crítica."
        : `${realIssues.length} tipo(s) · ${realIssues.reduce((a, i) => a + i.count, 0)} ocorrência(s).`;

    const report = await prisma.integrityReport.create({
      data: {
        status,
        summary,
        issues: issues.filter((i) => i.count > 0 || i.type === "postgresql") as object[],
        checkedAt: new Date(),
      },
    });

    const durationMs = Date.now() - t0;
    await writeAuditLog(
      status === "error" ? "Integridade com erro" : "Integridade concluída",
      `${summary} (${durationMs}ms)`,
      { user: opts?.user || "Sistema" },
    );

    return { ...report, durationMs };
  } catch (e) {
    await writeAuditLog(
      "Integridade com erro",
      e instanceof Error ? e.message : "Falha",
      { user: opts?.user || "Sistema" },
    );
    throw e;
  }
}

export async function getLatestIntegrityReport() {
  return prisma.integrityReport.findFirst({
    orderBy: { createdAt: "desc" },
  });
}
