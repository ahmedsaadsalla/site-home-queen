/**
 * Exporta backup de emergência do Postgres → data/backup-export-*.json
 * Uso: npx tsx scripts/export-backup.ts
 */
import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const DATA = path.join(process.cwd(), "data");
  await fs.mkdir(DATA, { recursive: true });

  const payload = {
    exportedAt: new Date().toISOString(),
    sections: await prisma.cmsSection.findMany(),
    categories: await prisma.category.findMany(),
    products: await prisma.product.findMany(),
    brands: await prisma.brand.findMany(),
    adminUsers: await prisma.adminUser.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        // passwordHash omitted for safety in generic backup log; full restore uses import with hashes
      },
    }),
    customers: await prisma.customer.findMany({
      include: { addresses: true, orders: { include: { items: true } } },
    }),
    dealers: await prisma.dealer.findMany(),
    quotes: await prisma.quote.findMany(),
    wholesaleQuotes: await prisma.wholesaleQuote.findMany(),
    contactMessages: await prisma.contactMessage.findMany(),
    media: await prisma.mediaAsset.findMany(),
    coupons: await prisma.coupon.findMany(),
    orders: await prisma.order.findMany({ include: { items: true } }),
    logs: await prisma.adminLog.findMany({ take: 500 }),
  };

  const file = path.join(
    DATA,
    `backup-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  console.log("Backup salvo em", file);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
