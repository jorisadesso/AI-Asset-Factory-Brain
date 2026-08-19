import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { validateFile, extractTextFromBuffer } from "@/lib/document/processor";
import type { SectionType } from "@/types";
import { SECTION_CONFIGS } from "@/types";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { createSemaphore } from "@/lib/api/semaphore";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage/files";
import { VALID_SECTION_TYPES } from "@/lib/api/constants";

const aiSemaphore = createSemaphore(5);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const rl = checkRateLimit(session.user.id, 20);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Uploads. Bitte warte kurz." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sectionType = formData.get("sectionType") as string | null;
    const questionKey = formData.get("questionKey") as string | null;
    const questionLabel = formData.get("questionLabel") as string | null;

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

    // Save file to persistent storage before extraction
    const { storedName, fileSize } = await saveUploadedFile(buffer, file.name);
    const mimeType = file.type || "application/octet-stream";

    let processedDoc;
    try {
      processedDoc = await extractTextFromBuffer(buffer, file.name, file.type);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      await deleteUploadedFile(storedName);
      console.warn("[section-upload] extraction failed, file deleted:", storedName, message);
      return NextResponse.json({ error: message }, { status: 422 });
    }

    if (!processedDoc.text.trim()) {
      await deleteUploadedFile(storedName);
      console.warn("[section-upload] no readable text, file deleted:", storedName);
      return NextResponse.json(
        { error: "Das Dokument enthält keinen lesbaren Text." },
        { status: 422 }
      );
    }

    // Multi-question extraction: all questions in one pass
    const questionsRaw = formData.get("questions") as string | null;
    if (questionsRaw) {
      const { extractAnswersForSection } = await import("@/lib/ai/service");
      let questions: Array<{ key: string; label: string; type?: string }>;
      try {
        questions = JSON.parse(questionsRaw) as Array<{ key: string; label: string; type?: string }>;
        if (!Array.isArray(questions)) throw new Error("not array");
      } catch {
        return NextResponse.json({ error: "Ungültige Frageliste." }, { status: 400 });
      }

      // All questions extracted in one batched call per chunk — much faster than N individual calls
      const sectionResults = await aiSemaphore(() => extractAnswersForSection(processedDoc.text, questions));

      const answers: Record<string, string> = {};
      const warnings: Record<string, string> = {};
      for (const q of questions) {
        const r = sectionResults[q.key];
        if (r?.answer.trim()) answers[q.key] = r.answer;
        if (r?.warning) warnings[q.key] = r.warning;
      }

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DOCUMENT_PROCESSED",
          details: JSON.stringify({ fileName: file.name, storedName, fileSize, mimeType, sectionType, questionCount: questions.length, filledCount: Object.keys(answers).length }),
        },
      });

      // Cross-section extraction: check other sections for relevant content
      const crossCheck = formData.get("crossCheck") === "true";
      if (crossCheck) {
        const otherSections = SECTION_CONFIGS.filter(
          (s) => s.type !== sectionType && s.questions.length > 0
        );
        const crossResults = await Promise.all(
          otherSections.map(async (section) => {
            const sectionAnswers: Record<string, string> = {};
            const qResults = await aiSemaphore(() => extractAnswersForSection(processedDoc.text, section.questions));
            for (const [key, val] of Object.entries(qResults)) {
              if (val.answer.trim()) sectionAnswers[key] = val.answer;
            }
            if (Object.keys(sectionAnswers).length === 0) return null;
            return { sectionType: section.type, sectionLabel: section.label, answers: sectionAnswers };
          })
        );
        const crossSections = crossResults.filter((r): r is NonNullable<typeof r> => r !== null);
        return NextResponse.json({ success: true, answers, warnings, crossSections });
      }

      return NextResponse.json({ success: true, answers, warnings });
    }

    // Single-question extraction (legacy)
    if (questionKey && questionLabel) {
      const { extractAnswerForQuestion } = await import("@/lib/ai/service");
      const result = await extractAnswerForQuestion(processedDoc.text, questionLabel);

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DOCUMENT_PROCESSED",
          details: JSON.stringify({ fileName: file.name, storedName, fileSize, mimeType, sectionType, questionKey, confidence: result.confidence }),
        },
      });

      return NextResponse.json({
        success: true,
        questionKey,
        answer: result.answer,
        confidence: result.confidence,
        warning: result.warning,
      });
    }

    // Full section extraction (legacy)
    const { extractKnowledgeFromText } = await import("@/lib/ai/service");
    const extracted = await extractKnowledgeFromText(processedDoc.text, sectionType as SectionType);

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOCUMENT_PROCESSED",
        details: JSON.stringify({ fileName: file.name, storedName, fileSize, mimeType, sectionType, confidence: extracted.confidence }),
      },
    });

    return NextResponse.json({ success: true, fileName: file.name, extractedInfo: extracted });
  } catch {
    return NextResponse.json(
      { error: "Upload fehlgeschlagen. Bitte versuchen Sie es erneut." },
      { status: 500 }
    );
  }
}
