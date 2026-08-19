import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { readUploadedFile } from "@/lib/storage/files";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { id } = await params;

  const log = await prisma.auditLog.findUnique({ where: { id } });
  if (!log || log.userId !== session.user.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  let details: Record<string, unknown> = {};
  try { details = JSON.parse(log.details) as Record<string, unknown>; } catch { /* */ }

  const storedName = details.storedName as string | undefined;
  const fileName = (details.fileName as string | undefined) ?? "dokument";
  const mimeType = (details.mimeType as string | undefined) ?? "application/octet-stream";

  if (!storedName) {
    return NextResponse.json({ error: "Datei nicht verfügbar" }, { status: 404 });
  }

  const buffer = await readUploadedFile(storedName);
  if (!buffer) {
    return NextResponse.json({ error: "Datei nicht gefunden" }, { status: 404 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, no-store",
    },
  });
}
