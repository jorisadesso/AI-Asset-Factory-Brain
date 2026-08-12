import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { updateBrainCompletion } from "@/lib/completion/scorer";
import { generateSectionMarkdown } from "@/lib/knowledge/generator";
import { SectionKey } from "@/types";
import { z } from "zod";

const UpdateSchema = z.object({
  sectionKey: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const body = await req.json();
  const { sectionKey, data } = UpdateSchema.parse(body);

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Brain nicht gefunden" }, { status: 404 });

  await prisma.brainSection.upsert({
    where: { brainId_sectionKey: { brainId: brain.id, sectionKey } },
    create: {
      brainId: brain.id,
      sectionKey,
      data: JSON.stringify(data),
    },
    update: { data: JSON.stringify(data) },
  });

  const totalScore = await updateBrainCompletion(brain.id);

  // Generate markdown async (best-effort)
  generateSectionMarkdown(brain.id, sectionKey as SectionKey).catch(console.error);

  return NextResponse.json({ success: true, completionScore: totalScore });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sectionKey = searchParams.get("key");

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Brain nicht gefunden" }, { status: 404 });

  if (sectionKey) {
    const section = await prisma.brainSection.findUnique({
      where: { brainId_sectionKey: { brainId: brain.id, sectionKey } },
    });
    return NextResponse.json({ section });
  }

  const sections = await prisma.brainSection.findMany({ where: { brainId: brain.id } });
  return NextResponse.json({ sections });
}
