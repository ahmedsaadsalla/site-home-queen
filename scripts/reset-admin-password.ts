import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const password = process.env.SEED_ADMIN_PASSWORD || "h147369n#";

async function main() {
  const users = await prisma.adminUser.findMany({
    select: { id: true, username: true, email: true, active: true },
  });
  console.log("admins:", JSON.stringify(users));
  const hash = await bcrypt.hash(password, 12);

  if (users.length === 0) {
    await prisma.adminUser.create({
      data: {
        id: "adm_root",
        name: "Administrador",
        username: "admin@homequeen",
        email: "admin@homequeen.com.br",
        passwordHash: hash,
        role: "Administrador",
        active: true,
      },
    });
    console.log("created admin@homequeen");
  } else {
    const target =
      users.find((u) => u.username === "admin@homequeen") || users[0];
    await prisma.adminUser.update({
      where: { id: target.id },
      data: { passwordHash: hash, active: true },
    });
    console.log("updated", target.username);
  }
  console.log("OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
