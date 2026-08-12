import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { generateAllMarkdown } from "@/lib/knowledge/generator";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("file");

  if (filename) {
    const doc = await prisma.knowledgeDocument.findUnique({
      where: { brainId_filename: { brainId: brain.id, filename } },
    });
    return NextResponse.json({ document: doc });
  }

  const documents = await prisma.knowledgeDocument.findMany({
    where: { brainId: brain.id },
    orderBy: { filename: "asc" },
  });

  return NextResponse.json({ documents });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await generateAllMarkdown(brain.id);

  const documents = await prisma.knowledgeDocument.findMany({
    where: { brainId: brain.id },
    orderBy: { filename: "asc" },
  });

  return NextResponse.json({ success: true, documents });
}
