import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { getBrainWhere } from "@/lib/db/brain";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const where = await getBrainWhere(session.user.id);
  const brain = await prisma.brain.findFirst({
    where,
    include: { knowledgeDocs: { orderBy: { updatedAt: "desc" } } },
  });

  if (!brain) return NextResponse.json([]);

  return NextResponse.json(
    brain.knowledgeDocs.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      content: d.content,
      sectionType: d.sectionType,
      version: d.version,
      updatedAt: d.updatedAt.toISOString(),
    }))
  );
}
