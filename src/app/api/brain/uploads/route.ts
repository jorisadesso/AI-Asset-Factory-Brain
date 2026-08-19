import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      userId: session.user.id,
      action: { in: ["DOCUMENT_PROCESSED", "GLOBAL_DOCUMENT_PROCESSED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const uploads = logs.map((log) => {
    let details: Record<string, unknown> = {};
    try { details = JSON.parse(log.details) as Record<string, unknown>; } catch { /* */ }
    return {
      id: log.id,
      fileName: (details.fileName as string) ?? "Unbekannte Datei",
      mimeType: (details.mimeType as string) ?? null,
      fileSize: (details.fileSize as number) ?? null,
      hasFile: typeof details.storedName === "string",
      sectionsUpdated: Array.isArray(details.sectionsUpdated) ? (details.sectionsUpdated as string[]) : [],
      filledCount: (details.filledCount as number) ?? (details.totalFilled as number) ?? 0,
      sectionType: (details.sectionType as string) ?? null,
      global: log.action === "GLOBAL_DOCUMENT_PROCESSED",
      uploadedAt: log.createdAt.toISOString(),
    };
  });

  return NextResponse.json(uploads);
}
