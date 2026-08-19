import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { getBrainWhere } from "@/lib/db/brain";
import { runQualityCheck } from "@/lib/ai/service";
import type { SectionType } from "@/types";
import { safeParseArray } from "@/lib/db/parse";
import { checkRateLimit } from "@/lib/api/rateLimit";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const rl = checkRateLimit(session.user.id, 10);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Qualitätsprüfungen. Bitte warte kurz." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const where = getBrainWhere(session.user.id);
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
      features: safeParseArray(c.features),
      usps: safeParseArray(c.usps),
    })),
    targetGroups: brain.targetGroups.map((g) => ({
      name: g.name,
      description: g.description ?? undefined,
      personas: g.personas,
    })),
  });

  try {
    await prisma.$transaction([
      prisma.qualityCheck.deleteMany({ where: { brainId: brain.id } }),
      prisma.qualityCheck.create({
        data: {
          brainId: brain.id,
          status: "COMPLETE",
          findings: JSON.stringify(result.findings),
          score: result.score,
        },
      }),
    ]);
  } catch (err) {
    console.error("[quality-check] DB persist failed:", err);
    return NextResponse.json({ error: "Ergebnis konnte nicht gespeichert werden. Bitte erneut versuchen." }, { status: 500 });
  }

  return NextResponse.json(result);
}
