import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { getBrainForUser } from "@/lib/db/brain";
import { z } from "zod";
import type { SectionType } from "@/types";
import { calculateCompletionScore, generateMarkdownForSection } from "@/lib/knowledge/generator";
import { SECTION_FILE_NAMES } from "@/types";

const answerSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ sectionType: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { sectionType } = await params;

  const body = await req.json() as unknown;
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const baseBrain = await getBrainForUser(session.user.id);
  const brain = await prisma.brain.findUnique({
    where: { id: baseBrain.id },
    include: { productCategories: true, targetGroups: true },
  });

  if (!brain) {
    return NextResponse.json({ error: "Brain nicht gefunden" }, { status: 404 });
  }

  const { answers } = parsed.data;

  const dynamicCount =
    sectionType === "PRODUCT_CATEGORIES"
      ? brain.productCategories.length
      : sectionType === "TARGET_GROUPS"
        ? brain.targetGroups.length
        : undefined;

  const score = calculateCompletionScore(
    sectionType as SectionType,
    answers,
    dynamicCount
  );

  let status = "OPEN";
  if (score >= 1) status = "COMPLETE";
  else if (score >= 0.5) status = "PARTIAL";
  else if (score > 0) status = "IN_PROGRESS";

  const section = await prisma.brainSection.upsert({
    where: { brainId_sectionType: { brainId: brain.id, sectionType } },
    create: { brainId: brain.id, sectionType, completionScore: score, status },
    update: { completionScore: score, status },
  });

  for (const [key, value] of Object.entries(answers)) {
    await prisma.answer.upsert({
      where: { sectionId_questionKey: { sectionId: section.id, questionKey: key } },
      create: { sectionId: section.id, questionKey: key, value },
      update: { value },
    });
  }

  const answerData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(answers)) {
    answerData[key] = value;
  }

  const markdown = generateMarkdownForSection(sectionType as SectionType, answerData, {
    productCategories: brain.productCategories.map((c) => ({
      name: c.name,
      description: c.description ?? undefined,
      features: JSON.parse(c.features) as string[],
      usps: JSON.parse(c.usps) as string[],
    })),
    targetGroups: [],
  });

  const fileName = SECTION_FILE_NAMES[sectionType as SectionType] ?? `${sectionType.toLowerCase()}.md`;

  await prisma.knowledgeDocument.upsert({
    where: { brainId_sectionType: { brainId: brain.id, sectionType } },
    create: { brainId: brain.id, fileName, content: markdown, sectionType },
    update: { content: markdown, version: { increment: 1 } },
  });

  const allSections = await prisma.brainSection.findMany({ where: { brainId: brain.id } });
  const avg = allSections.reduce((sum, s) => sum + s.completionScore, 0) / 10;
  await prisma.brain.update({
    where: { id: brain.id },
    data: { completionScore: avg },
  });

  return NextResponse.json({ success: true, score, status });
}
