import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { updateBrainCompletion } from "@/lib/completion/scorer";
import { generateSectionMarkdown } from "@/lib/knowledge/generator";
import { SectionKey } from "@/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { uploadedFileId, confirmedData } = await req.json();

  const extracted = await prisma.extractedInfo.findFirst({
    where: { uploadedFileId },
    include: { uploadedFile: true },
  });

  if (!extracted) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain || brain.id !== extracted.brainId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Update extracted info with confirmed data
  await prisma.extractedInfo.update({
    where: { id: extracted.id },
    data: { data: JSON.stringify(confirmedData), confirmed: true },
  });

  // Merge confirmed data into section
  const sectionKey = extracted.sectionKey as SectionKey;
  const existing = await prisma.brainSection.findUnique({
    where: { brainId_sectionKey: { brainId: brain.id, sectionKey } },
  });

  let currentData: Record<string, unknown> = {};
  if (existing?.data) {
    try {
      currentData = JSON.parse(existing.data);
    } catch {
      currentData = {};
    }
  }

  // Merge: new data takes precedence for non-empty values
  const merged = deepMerge(currentData, confirmedData as Record<string, unknown>);

  await prisma.brainSection.upsert({
    where: { brainId_sectionKey: { brainId: brain.id, sectionKey } },
    create: { brainId: brain.id, sectionKey, data: JSON.stringify(merged) },
    update: { data: JSON.stringify(merged) },
  });

  await updateBrainCompletion(brain.id);
  generateSectionMarkdown(brain.id, sectionKey).catch(console.error);

  return NextResponse.json({ success: true });
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    result[key] = value;
  }
  return result;
}
