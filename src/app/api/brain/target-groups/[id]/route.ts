import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { getBrainWhere } from "@/lib/db/brain";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { z } from "zod";
import { generateTargetGroupsMarkdown } from "@/lib/knowledge/generator";

const groupSchema = z.object({
  name: z.string().min(1).max(200),
  industry: z.string().optional(),
  description: z.string().optional(),
  personas: z.array(z.object({ description: z.string() })),
});

async function ensureOwnership(userId: string, groupId: string) {
  const brain = await prisma.brain.findFirst({ where: getBrainWhere(userId) });
  if (!brain) return null;
  const group = await prisma.targetGroup.findFirst({
    where: { id: groupId, brainId: brain.id },
  });
  return group ? brain : null;
}

async function regenerateMarkdown(brainId: string) {
  const groups = await prisma.targetGroup.findMany({
    where: { brainId },
    include: { personas: true },
    orderBy: { sortOrder: "asc" },
  });
  const markdown = generateTargetGroupsMarkdown(
    groups.map((g) => ({
      name: g.name,
      industry: g.industry ?? undefined,
      description: g.description ?? undefined,
      personas: g.personas,
    }))
  );
  await prisma.knowledgeDocument.upsert({
    where: { brainId_sectionType: { brainId, sectionType: "TARGET_GROUPS" } },
    create: { brainId, fileName: "target-groups.md", content: markdown, sectionType: "TARGET_GROUPS" },
    update: { content: markdown, version: { increment: 1 } },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const rl = checkRateLimit(`target-groups:${session.user.id}`, 30);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warte kurz." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const { id } = await params;
  const brain = await ensureOwnership(session.user.id, id);
  if (!brain) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const body = await req.json() as unknown;
  const parsed = groupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  await prisma.persona.deleteMany({ where: { targetGroupId: id } });
  const updated = await prisma.targetGroup.update({
    where: { id },
    data: {
      name: parsed.data.name,
      industry: parsed.data.industry,
      description: parsed.data.description,
      personas: {
        create: parsed.data.personas.map((p) => ({ description: p.description })),
      },
    },
    include: { personas: true },
  });

  await regenerateMarkdown(brain.id);
  return NextResponse.json({ ...updated, industry: updated.industry ?? "", description: updated.description ?? "" });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const rl = checkRateLimit(`target-groups:${session.user.id}`, 30);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warte kurz." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const { id } = await params;
  const brain = await ensureOwnership(session.user.id, id);
  if (!brain) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  await prisma.targetGroup.delete({ where: { id } });
  await regenerateMarkdown(brain.id);

  return NextResponse.json({ success: true });
}
