import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { validateFile, extractTextFromBuffer } from "@/lib/document/processor";
import { extractKnowledgeFromText } from "@/lib/ai/service";
import type { SectionType } from "@/types";
import { prisma } from "@/lib/db/prisma";


const VALID_SECTION_TYPES = new Set<string>([
  "COMPANY", "PRODUCT_CATEGORIES", "TARGET_GROUPS", "BRAND_LANGUAGE",
  "MARKETING_CONTENT", "SALES", "LEGAL_COMPLIANCE", "EXISTING_CONTENT",
  "VISUAL_GUIDELINES", "AI_RULES",
]);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sectionType = formData.get("sectionType") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen." }, { status: 400 });
    }

    if (!sectionType || !VALID_SECTION_TYPES.has(sectionType)) {
      return NextResponse.json({ error: "Ungültiger Bereich." }, { status: 400 });
    }

    const validation = validateFile(file.name, file.size, file.type);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text — file is never stored permanently
    let processedDoc;
    try {
      processedDoc = await extractTextFromBuffer(buffer, file.name, file.type);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      // Log without storing the file
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DOCUMENT_PROCESS_FAILED",
          details: JSON.stringify({ fileName: file.name, error: message }),
        },
      });
      return NextResponse.json({ error: message }, { status: 422 });
    }

    if (!processedDoc.text.trim()) {
      return NextResponse.json(
        { error: "Das Dokument enthält keinen lesbaren Text." },
        { status: 422 }
      );
    }

    // Extract structured knowledge via AI
    const extracted = await extractKnowledgeFromText(
      processedDoc.text,
      sectionType as SectionType
    );

    // Log successful processing (no file stored)
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOCUMENT_PROCESSED",
        details: JSON.stringify({
          fileName: file.name,
          sectionType,
          confidence: extracted.confidence,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      fileName: file.name,
      extractedInfo: extracted,
    });
  } catch {
    return NextResponse.json(
      { error: "Upload fehlgeschlagen. Bitte versuchen Sie es erneut." },
      { status: 500 }
    );
  }
}
