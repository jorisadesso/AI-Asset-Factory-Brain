import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { runQualityCheck } from "@/lib/ai/service";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({
    where: { userId: session.user.id },
    include: {
      sections: true,
      categories: true,
      targetGroups: { include: { personas: true } },
    },
  });
  if (!brain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Assemble brain data for quality check
  const brainData: Record<string, unknown> = {};
  for (const section of brain.sections) {
    try {
      brainData[section.sectionKey] = JSON.parse(section.data);
    } catch {
      brainData[section.sectionKey] = {};
    }
  }
  brainData.categories = brain.categories;
  brainData.targetGroups = brain.targetGroups;

  const issues = await runQualityCheck(brainData);

  const check = await prisma.qualityCheck.create({
    data: {
      brainId: brain.id,
      issues: JSON.stringify(issues),
      score: Math.max(0, 100 - issues.filter((i) => i.severity === "error").length * 20 - issues.filter((i) => i.severity === "warning").length * 10),
    },
  });

  return NextResponse.json({ issues, score: check.score });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const check = await prisma.qualityCheck.findFirst({
    where: { brainId: brain.id },
    orderBy: { createdAt: "desc" },
  });

  if (!check) return NextResponse.json({ issues: [], score: null });

  return NextResponse.json({
    issues: JSON.parse(check.issues),
    score: check.score,
    completedAt: check.completedAt,
  });
}
