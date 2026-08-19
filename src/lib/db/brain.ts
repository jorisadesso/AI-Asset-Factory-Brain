import { prisma } from "@/lib/db/prisma";

/** Return the Prisma where-clause for the brain that belongs to a user. */
export function getBrainWhere(userId: string) {
  return { userId };
}

/** Return the brain for a user. Creates one if missing. */
export async function getBrainForUser(userId: string) {
  const brain = await prisma.brain.findFirst({ where: { userId } });
  if (brain) return brain;

  return prisma.brain.create({
    data: { userId, name: "Mein AI Asset Factory Brain" },
  });
}
