import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { getBrainForUser } from "@/lib/db/brain";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { z } from "zod";
import { generateTargetGroupsMarkdown } from "@/lib/knowledge/generator";

const groupSchema = z.object({
  name: z.string().min(1).max(200),
  industry: z.string().optional(),
  description: z.string().optional(),
  personas: z.array(z.object({ description: z.string() })),
});

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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const brain = await getBrainForUser(session.user.id);
  if (!brain) return NextResponse.json([]);

  const groups = await prisma.targetGroup.findMany({
    where: { brainId: brain.id },
    include: { personas: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(
    groups.map((g) => ({ ...g, industry: g.industry ?? "", description: g.description ?? "" }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const rl = checkRateLimit(`target-groups:${session.user.id}`, 30);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warte kurz." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const body = await req.json() as unknown;
  const parsed = groupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const brain = await getBrainForUser(session.user.id);
  if (!brain) return NextResponse.json({ error: "Brain nicht gefunden" }, { status: 404 });

  const count = await prisma.targetGroup.count({ where: { brainId: brain.id } });

  const group = await prisma.targetGroup.create({
    data: {
      brainId: brain.id,
      name: parsed.data.name,
      industry: parsed.data.industry,
      description: parsed.data.description,
      sortOrder: count,
      personas: {
        create: parsed.data.personas.map((p) => ({ description: p.description })),
      },
    },
    include: { personas: true },
  });

  await regenerateMarkdown(brain.id);
  return NextResponse.json({ ...group, industry: group.industry ?? "", description: group.description ?? "" });
}
