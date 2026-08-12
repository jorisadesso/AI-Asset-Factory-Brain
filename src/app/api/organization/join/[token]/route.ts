import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) {
    return NextResponse.json({ error: "Einladung nicht gefunden" }, { status: 404 });
  }
  if (invitation.usedAt) {
    return NextResponse.json({ error: "Einladung bereits verwendet" }, { status: 410 });
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Einladung abgelaufen" }, { status: 410 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  if (currentUser?.organizationId === invitation.organizationId) {
    return NextResponse.json({ error: "Bereits Mitglied dieser Organisation" }, { status: 409 });
  }

  // Join the org
  await prisma.user.update({
    where: { id: session.user.id },
    data: { organizationId: invitation.organizationId, role: invitation.role },
  });

  // Mark invitation used
  await prisma.invitation.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  const org = await prisma.organization.findUnique({
    where: { id: invitation.organizationId },
    select: { name: true },
  });

  return NextResponse.json({ success: true, organizationName: org?.name });
}

/** GET — preview what org the invite belongs to (for the join page) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    organizationName: invitation.organization.name,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
  });
}
