import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

/** GET — return current org + members */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return NextResponse.json({ organization: null, members: [] });
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    include: {
      users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
    },
  });

  if (!org) return NextResponse.json({ organization: null, members: [] });

  return NextResponse.json({
    organization: { id: org.id, name: org.name },
    members: org.users,
    currentUserId: session.user.id,
  });
}

const createSchema = z.object({ name: z.string().min(1).max(200) });

/** POST — create a new organization, make caller the OWNER */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });
  if (user?.organizationId) {
    return NextResponse.json({ error: "Bereits in einer Organisation" }, { status: 409 });
  }

  const body = await req.json() as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const org = await prisma.organization.create({ data: { name: parsed.data.name } });

  // Link user + their brain to the org
  await prisma.user.update({
    where: { id: session.user.id },
    data: { organizationId: org.id, role: "OWNER" },
  });

  await prisma.brain.updateMany({
    where: { userId: session.user.id },
    data: { organizationId: org.id },
  });

  return NextResponse.json({ organization: { id: org.id, name: org.name } }, { status: 201 });
}
