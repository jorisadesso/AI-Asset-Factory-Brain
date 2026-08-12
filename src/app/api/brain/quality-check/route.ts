import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { getBrainWhere } from "@/lib/db/brain";
import { runQualityCheck } from "@/lib/ai/service";
import type { SectionType } from "@/types";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const where = await getBrainWhere(session.user.id);
  const brain = await prisma.brain.findFirst({
    where,
    include: {
      sections: { include: { answers: true } },
      productCategories: true,
      targetGroups: { include: { personas: true } },
    },
  });

  if (!brain) {
    return NextResponse.json({ error: "Brain nicht gefunden" }, { status: 404 });
  }

  // Build quality check input
  const sections = brain.sections.map((s) => {
    const answers: Record<string, string> = {};
    for (const a of s.answers) {
      answers[a.questionKey] = a.value;
    }
    return {
      sectionType: s.sectionType as SectionType,
      status: s.status,
      completionScore: s.completionScore,
      answers,
    };
  });

  const result = await runQualityCheck({
    sections,
    productCategories: brain.productCategories.map((c) => ({
      name: c.name,
      description: c.description ?? undefined,
      features: JSON.parse(c.features) as string[],
      usps: JSON.parse(c.usps) as string[],
    })),
    targetGroups: brain.targetGroups.map((g) => ({
      name: g.name,
      description: g.description ?? undefined,
      personas: g.personas,
    })),
  });

  // Save result
  await prisma.qualityCheck.create({
    data: {
      brainId: brain.id,
      status: "COMPLETE",
      findings: JSON.stringify(result.findings),
      score: result.score,
    },
  });

  return NextResponse.json(result);
}
