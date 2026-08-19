import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { getBrainWhere } from "@/lib/db/brain";
import JSZip from "jszip";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const where = getBrainWhere(session.user.id);
  const brain = await prisma.brain.findFirst({ where, include: { knowledgeDocs: true } });

  if (!brain || brain.knowledgeDocs.length === 0) {
    return NextResponse.json({ error: "Keine Dokumente vorhanden" }, { status: 404 });
  }

  const zip = new JSZip();
  const folder = zip.folder("wissensbasis");
  if (!folder) {
    return NextResponse.json({ error: "ZIP-Fehler" }, { status: 500 });
  }

  for (const doc of brain.knowledgeDocs) {
    folder.file(doc.fileName, doc.content);
  }

  // Add a README
  const docList = brain.knowledgeDocs
    .map((d) => `- ${d.fileName} (v${d.version})`)
    .join("\n");
  folder.file(
    "README.md",
    `# AI Asset Factory Brain — Wissensbasis\n\nExportiert am: ${new Date().toLocaleDateString("de-DE")}\n\n## Enthaltene Dateien\n\n${docList}\n`
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="wissensbasis-${new Date().toISOString().slice(0, 10)}.zip"`,
      "Content-Length": String(uint8.byteLength),
    },
  });
}
