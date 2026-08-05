import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { createPasswordHash, onlyDigits } from "@/lib/customerStore";
import { sendMail } from "@/lib/mailer";

const RESET_MS = 60 * 60 * 1000; // 1h

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestCustomerPasswordReset(identity: string) {
  const raw = identity.trim();
  if (!raw) return { ok: true as const };

  const digits = onlyDigits(raw);
  const customer = await prisma.customer.findFirst({
    where: raw.includes("@")
      ? { email: { equals: raw, mode: "insensitive" } }
      : digits.length === 11
        ? { cpf: digits }
        : {
            OR: [
              { email: { equals: raw, mode: "insensitive" } },
              { cpf: digits || raw },
            ],
          },
  });

  // Resposta genérica (não revela se o cadastro existe)
  if (!customer) return { ok: true as const };

  const token = randomBytes(32).toString("hex");
  await prisma.customerPasswordReset.deleteMany({
    where: { customerId: customer.id },
  });
  await prisma.customerPasswordReset.create({
    data: {
      tokenHash: hashToken(token),
      customerId: customer.id,
      expiresAt: new Date(Date.now() + RESET_MS),
    },
  });

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";
  const link = `${base}/minha-conta?redefinir=${token}`;

  if (customer.email) {
    await sendMail({
      to: customer.email,
      subject: "Redefinição de senha — Home Queen",
      text: `Olá ${customer.name},\n\nPara redefinir sua senha, acesse o link (válido por 1 hora):\n\n${link}\n\nSe você não solicitou, ignore este e-mail.\n\nHome Queen`,
    }).catch(() => undefined);
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[cliente reset]", link);
  }

  return {
    ok: true as const,
    link: process.env.NODE_ENV === "development" ? link : undefined,
  };
}

export async function resetCustomerPasswordWithToken(
  token: string,
  newPassword: string,
) {
  if (!token || newPassword.length < 6) {
    throw new Error("Dados inválidos.");
  }
  const rec = await prisma.customerPasswordReset.findFirst({
    where: {
      tokenHash: hashToken(token),
      expiresAt: { gt: new Date() },
    },
  });
  if (!rec) throw new Error("Link inválido ou expirado.");

  await prisma.customer.update({
    where: { id: rec.customerId },
    data: { passwordHash: await createPasswordHash(newPassword) },
  });
  await prisma.customerPasswordReset.deleteMany({
    where: { customerId: rec.customerId },
  });
  return true;
}
