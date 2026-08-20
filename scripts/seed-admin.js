#!/usr/bin/env node
// Creates a default admin user if no users exist in the DB.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`Seed: ${count} user(s) already exist — skipping.`);
    return;
  }

  const email = process.env.ADMIN_EMAIL || "admin@adesso.de";
  const password = process.env.ADMIN_PASSWORD || "Brain2024!";
  const name = process.env.ADMIN_NAME || "Admin";

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, name, passwordHash },
  });

  console.log(`Seed: Admin user created — ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
