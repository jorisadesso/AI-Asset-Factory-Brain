import { prisma } from "@/lib/db/prisma";

/** Resolve which Brain belongs to a user, preferring the org-level brain. */
export async function getBrainWhere(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  return user?.organizationId
    ? { organizationId: user.organizationId }
    : { userId };
}

/** Return the brain for a user (no relations). Creates one if missing. */
export async function getBrainForUser(userId: string) {
  const where = await getBrainWhere(userId);
  const brain = await prisma.brain.findFirst({ where });
  if (brain) return brain;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  return prisma.brain.create({
    data: {
      userId,
      ...(user?.organizationId ? { organizationId: user.organizationId } : {}),
      name: "Mein AI Asset Factory Brain",
    },
  });
}
