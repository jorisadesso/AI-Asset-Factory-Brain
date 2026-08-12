import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { getBrainWhere } from "@/lib/db/brain";
import { SECTION_CONFIGS } from "@/types";
import { calculateCompletionScore } from "@/lib/knowledge/generator";
import type { SectionType } from "@/types";

type BrainWithRelations = {
  id: string;
  name: string;
  completionScore: number;
  sections: Array<{
    id: string;
    sectionType: string;
    status: string;
    completionScore: number;
    answers: Array<{ questionKey: string; value: string }>;
  }>;
  productCategories: Array<{
    id: string;
    name: string;
    description: string | null;
    features: string;
    usps: string;
    sortOrder: number;
  }>;
  targetGroups: Array<{
    id: string;
    name: string;
    industry: string | null;
    description: string | null;
    sortOrder: number;
    personas: Array<{ id: string; description: string }>;
  }>;
  knowledgeDocs: Array<{ id: string; fileName: string; sectionType: string; version: number; updatedAt: Date }>;
  qualityChecks: Array<{ id: string; status: string; findings: string; score: number }>;
};

const BRAIN_INCLUDE = {
  sections: { include: { answers: true } },
  productCategories: true,
  targetGroups: { include: { personas: true } },
  knowledgeDocs: true,
  qualityChecks: { orderBy: { createdAt: "desc" } as const, take: 1 },
} as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const where = await getBrainWhere(session.user.id);
  let brain = await prisma.brain.findFirst({ where, include: BRAIN_INCLUDE });
  if (!brain) {
    brain = await prisma.brain.create({
      data: { userId: session.user.id, name: "Mein AI Asset Factory Brain" },
      include: BRAIN_INCLUDE,
    });
  }

  return NextResponse.json(formatBrain(brain as unknown as BrainWithRelations));
}

function formatBrain(brain: BrainWithRelations) {
  const sectionsMap = new Map(brain.sections.map((s) => [s.sectionType, s]));

  const sections = SECTION_CONFIGS.map((config) => {
    const dbSection = sectionsMap.get(config.type);
    const answers: Record<string, string> = {};
    if (dbSection) {
      for (const a of dbSection.answers) {
        answers[a.questionKey] = a.value;
      }
    }
    const dynamicCount =
      config.type === "PRODUCT_CATEGORIES"
        ? brain.productCategories.length
        : config.type === "TARGET_GROUPS"
          ? brain.targetGroups.length
          : undefined;

    const score = dbSection?.completionScore ??
      calculateCompletionScore(config.type, answers, dynamicCount);

    let status = "OPEN";
    if (score >= 1) status = "COMPLETE";
    else if (score >= 0.5) status = "PARTIAL";
    else if (score > 0) status = "IN_PROGRESS";

    return {
      id: dbSection?.id ?? config.type,
      sectionType: config.type,
      status,
      completionScore: score,
      answers,
    };
  });

  const overallScore =
    sections.reduce((sum, s) => sum + s.completionScore, 0) / sections.length;

  return {
    id: brain.id,
    name: brain.name,
    completionScore: overallScore,
    sections,
    productCategories: brain.productCategories.map((c) => ({
      ...c,
      description: c.description ?? "",
      features: JSON.parse(c.features) as string[],
      usps: JSON.parse(c.usps) as string[],
    })),
    targetGroups: brain.targetGroups.map((g) => ({
      ...g,
      industry: g.industry ?? "",
      description: g.description ?? "",
      personas: g.personas,
    })),
    knowledgeDocs: brain.knowledgeDocs.map((d) => ({
      ...d,
      updatedAt: d.updatedAt.toISOString(),
    })),
    qualityCheck: brain.qualityChecks[0]
      ? {
          ...brain.qualityChecks[0],
          findings: JSON.parse(brain.qualityChecks[0].findings) as unknown[],
        }
      : null,
  };
}

export { formatBrain, BRAIN_INCLUDE };
type _SectionType = SectionType; // keep import used
