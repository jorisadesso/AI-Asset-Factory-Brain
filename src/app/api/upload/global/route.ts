import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { validateFile, extractTextFromBuffer } from "@/lib/document/processor";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage/files";
import { SECTION_CONFIGS } from "@/types";
import { prisma } from "@/lib/db/prisma";
import { getBrainForUser } from "@/lib/db/brain";
import { safeParseArray } from "@/lib/db/parse";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { calculateCompletionScore, generateMarkdownForSection } from "@/lib/knowledge/generator";
import { SECTION_FILE_NAMES } from "@/types";
import type { SectionType } from "@/types";
import { NextResponse } from "next/server";

const enc = new TextEncoder();

function sse(data: Record<string, unknown>): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function sseDone(): Uint8Array {
  return enc.encode("data: [DONE]\n\n");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const rl = checkRateLimit(session.user.id, 5);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Uploads. Bitte warte kurz." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Keine Datei hochgeladen." }, { status: 400 });

  const validation = validateFile(file.name, file.size, file.type);
  if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  const { storedName, fileSize } = await saveUploadedFile(buffer, file.name);
  const mimeType = file.type || "application/octet-stream";

  let processedDoc: Awaited<ReturnType<typeof extractTextFromBuffer>>;
  try {
    processedDoc = await extractTextFromBuffer(buffer, file.name, file.type);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    await deleteUploadedFile(storedName);
    console.warn("[global-upload] extraction failed, file deleted:", storedName, message);
    return NextResponse.json({ error: message }, { status: 422 });
  }

  if (!processedDoc.text.trim()) {
    await deleteUploadedFile(storedName);
    console.warn("[global-upload] no readable text, file deleted:", storedName);
    return NextResponse.json({ error: "Das Dokument enthält keinen lesbaren Text." }, { status: 422 });
  }

  const userId = session.user.id;
  const docText = processedDoc.text;
  const fileName = file.name;

  const signal = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { extractAnswersForSection } = await import("@/lib/ai/service");
        const baseBrain = await getBrainForUser(userId);
        const brain = await prisma.brain.findUnique({
          where: { id: baseBrain.id },
          include: { productCategories: true, targetGroups: true },
        });
        if (!brain) {
          controller.enqueue(sse({ error: "Brain nicht gefunden" }));
          controller.enqueue(sseDone());
          controller.close();
          return;
        }

        const standardSections = SECTION_CONFIGS.filter((c) => c.questions.length > 0);
        const total = standardSections.length;
        const savedSections: string[] = [];
        let totalFilled = 0;

        // All sections in parallel — each sends its own progress/done SSE events
        await Promise.all(
          standardSections.map(async (config, i) => {
            if (signal.aborted) return;

            controller.enqueue(sse({
              type: "progress",
              step: i + 1,
              total,
              sectionType: config.type,
              label: config.label,
            }));

            const sectionResults = await extractAnswersForSection(docText, config.questions);

            if (signal.aborted) return;

            const newAnswers: Record<string, string> = {};
            for (const [key, val] of Object.entries(sectionResults)) {
              if (val.answer.trim()) newAnswers[key] = val.answer;
            }

            if (Object.keys(newAnswers).length > 0) {
              await prisma.$transaction(async (tx) => {
                const existing = await tx.brainSection.findUnique({
                  where: { brainId_sectionType: { brainId: brain.id, sectionType: config.type } },
                  include: { answers: true },
                });
                const existingAnswers: Record<string, string> = {};
                if (existing) {
                  for (const a of existing.answers) existingAnswers[a.questionKey] = a.value;
                }
                const mergedAnswers = { ...existingAnswers, ...newAnswers };

                const score = calculateCompletionScore(config.type as SectionType, mergedAnswers);
                const status = score >= 1 ? "COMPLETE" : score >= 0.5 ? "PARTIAL" : score > 0 ? "IN_PROGRESS" : "OPEN";

                const section = await tx.brainSection.upsert({
                  where: { brainId_sectionType: { brainId: brain.id, sectionType: config.type } },
                  create: { brainId: brain.id, sectionType: config.type, completionScore: score, status },
                  update: { completionScore: score, status },
                });

                await Promise.all(
                  Object.entries(mergedAnswers).map(([key, value]) =>
                    tx.answer.upsert({
                      where: { sectionId_questionKey: { sectionId: section.id, questionKey: key } },
                      create: { sectionId: section.id, questionKey: key, value },
                      update: { value },
                    })
                  )
                );

                const markdown = generateMarkdownForSection(config.type as SectionType, mergedAnswers, {
                  productCategories: brain.productCategories.map((c) => ({
                    name: c.name, description: c.description ?? undefined,
                    features: safeParseArray(c.features), usps: safeParseArray(c.usps),
                  })),
                  targetGroups: [],
                });
                const mdFileName = SECTION_FILE_NAMES[config.type as SectionType] ?? `${config.type.toLowerCase()}.md`;
                await tx.knowledgeDocument.upsert({
                  where: { brainId_sectionType: { brainId: brain.id, sectionType: config.type } },
                  create: { brainId: brain.id, fileName: mdFileName, content: markdown, sectionType: config.type },
                  update: { content: markdown, version: { increment: 1 } },
                });

                savedSections.push(config.type);
                totalFilled += Object.keys(newAnswers).length;
              });
            }

            controller.enqueue(sse({
              type: "section_done",
              step: i + 1,
              total,
              sectionType: config.type,
              label: config.label,
              filledCount: Object.keys(newAnswers).length,
            }));
          })
        );

        if (!signal.aborted) {
          const allSections = await prisma.brainSection.findMany({ where: { brainId: brain.id } });
          const sectionCount = Math.max(allSections.length, 1);
          const avg = allSections.reduce((sum, s) => sum + s.completionScore, 0) / sectionCount;
          await prisma.brain.update({ where: { id: brain.id }, data: { completionScore: avg } });

          await prisma.auditLog.create({
            data: {
              userId,
              brainId: brain.id,
              action: "GLOBAL_DOCUMENT_PROCESSED",
              details: JSON.stringify({ fileName, storedName, fileSize, mimeType, sectionsUpdated: savedSections }),
            },
          });

          controller.enqueue(sse({ type: "done", sectionsUpdated: savedSections, totalFilled }));
        }

        controller.enqueue(sseDone());
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload fehlgeschlagen.";
        try {
          await deleteUploadedFile(storedName);
          console.warn("[global-upload] stream error, file deleted:", storedName, message);
        } catch {
          // cleanup error must not shadow the primary error
        }
        controller.enqueue(sse({ error: message }));
        controller.enqueue(sseDone());
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
