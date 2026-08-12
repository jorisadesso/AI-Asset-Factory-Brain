import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["ADMIN", "EDITOR"]).default("EDITOR"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true },
  });

  if (!user?.organizationId) {
    return NextResponse.json({ error: "Keine Organisation vorhanden" }, { status: 403 });
  }
  if (user.role === "EDITOR") {
    return NextResponse.json({ error: "Keine Berechtigung zum Einladen" }, { status: 403 });
  }

  const body = await req.json() as unknown;
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: user.organizationId,
      email: parsed.data.email || null,
      role: parsed.data.role,
      expiresAt,
      createdById: session.user.id,
    },
  });

  const joinUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/join/${invitation.token}`;

  return NextResponse.json({ token: invitation.token, joinUrl, expiresAt });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true },
  });

  if (!user?.organizationId || user.role === "EDITOR") {
    return NextResponse.json([]);
  }

  const invitations = await prisma.invitation.findMany({
    where: { organizationId: user.organizationId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return NextResponse.json(
    invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      joinUrl: `${base}/join/${inv.token}`,
      expiresAt: inv.expiresAt,
    }))
  );
}
