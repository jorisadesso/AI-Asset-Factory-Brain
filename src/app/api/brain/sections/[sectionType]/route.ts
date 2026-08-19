import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { getBrainForUser } from "@/lib/db/brain";
import { z } from "zod";
import type { SectionType } from "@/types";
import { calculateCompletionScore, generateMarkdownForSection } from "@/lib/knowledge/generator";
import { SECTION_FILE_NAMES } from "@/types";
import { safeParseArray } from "@/lib/db/parse";
import { VALID_SECTION_TYPES } from "@/lib/api/constants";

const answerSchema = z.object({
  answers: z.record(z.string(), z.string().max(5000, "Antwort darf maximal 5000 Zeichen haben")),
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

  if (!VALID_SECTION_TYPES.has(sectionType)) {
    return NextResponse.json({ error: "Ungültiger Bereich." }, { status: 400 });
  }

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

  await prisma.$transaction(async (tx) => {
    const section = await tx.brainSection.upsert({
      where: { brainId_sectionType: { brainId: brain.id, sectionType } },
      create: { brainId: brain.id, sectionType, completionScore: score, status },
      update: { completionScore: score, status },
    });

    await Promise.all(
      Object.entries(answers).map(([key, value]) =>
        tx.answer.upsert({
          where: { sectionId_questionKey: { sectionId: section.id, questionKey: key } },
          create: { sectionId: section.id, questionKey: key, value },
          update: { value },
        })
      )
    );

    const markdown = generateMarkdownForSection(sectionType as SectionType, answers, {
      productCategories: brain.productCategories.map((c) => ({
        name: c.name,
        description: c.description ?? undefined,
        features: safeParseArray(c.features),
        usps: safeParseArray(c.usps),
      })),
      targetGroups: [],
    });

    const fileName = SECTION_FILE_NAMES[sectionType as SectionType] ?? `${sectionType.toLowerCase()}.md`;

    await tx.knowledgeDocument.upsert({
      where: { brainId_sectionType: { brainId: brain.id, sectionType } },
      create: { brainId: brain.id, fileName, content: markdown, sectionType },
      update: { content: markdown, version: { increment: 1 } },
    });

    const allSections = await tx.brainSection.findMany({ where: { brainId: brain.id } });
    const sectionCount = Math.max(allSections.length, 1);
    const avg = allSections.reduce((sum, s) => sum + s.completionScore, 0) / sectionCount;
    await tx.brain.update({
      where: { id: brain.id },
      data: { completionScore: avg },
    });
  });

  return NextResponse.json({ success: true, score, status });
}
