import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { validateFile, extractText, ensureUploadDir, deleteTempFile } from "@/lib/document/processor";
import { extractFromDocument } from "@/lib/ai/service";
import { SectionKey } from "@/types";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Brain not found" }, { status: 404 });

  let tempPath: string | null = null;
  let uploadedFileId: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sectionKey = formData.get("sectionKey") as SectionKey | null;

    if (!file || !sectionKey) {
      return NextResponse.json({ error: "Datei und Bereich sind erforderlich" }, { status: 400 });
    }

    const validation = validateFile(file.name, file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Save temp file
    const uploadDir = await ensureUploadDir();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.name)}`;
    tempPath = path.join(uploadDir, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempPath, buffer);

    // Track in DB
    const uploadRecord = await prisma.uploadedFile.create({
      data: {
        brainId: brain.id,
        sectionKey,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        status: "processing",
        tempPath,
      },
    });
    uploadedFileId = uploadRecord.id;

    // Extract text
    const textResult = await extractText(tempPath, file.name);
    if (!textResult.success) {
      await prisma.uploadedFile.update({
        where: { id: uploadedFileId },
        data: { status: "failed" },
      });
      await deleteTempFile(tempPath);
      return NextResponse.json(
        { error: textResult.error || "Text konnte nicht extrahiert werden" },
        { status: 422 }
      );
    }

    // AI extraction
    const extraction = await extractFromDocument(textResult.text, sectionKey);

    // Save extracted info
    await prisma.extractedInfo.create({
      data: {
        uploadedFileId: uploadedFileId,
        brainId: brain.id,
        sectionKey,
        data: JSON.stringify(extraction.data),
        confirmed: false,
      },
    });

    // Mark file as completed and delete temp file
    await prisma.uploadedFile.update({
      where: { id: uploadedFileId },
      data: { status: "completed", tempPath: null },
    });

    await deleteTempFile(tempPath);
    tempPath = null;

    return NextResponse.json({
      success: true,
      uploadedFileId,
      extraction: {
        data: extraction.data,
        confidence: extraction.confidence,
        warnings: extraction.warnings,
      },
    });
  } catch (error) {
    // Cleanup on error
    if (tempPath) {
      await deleteTempFile(tempPath).catch(() => {});
    }
    if (uploadedFileId) {
      await prisma.uploadedFile.update({
        where: { id: uploadedFileId },
        data: { status: "failed", tempPath: null },
      }).catch(() => {});
    }

    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST_confirm(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { uploadedFileId } = await req.json();

  const extracted = await prisma.extractedInfo.findFirst({
    where: { uploadedFileId },
  });

  if (!extracted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.extractedInfo.update({
    where: { id: extracted.id },
    data: { confirmed: true },
  });

  return NextResponse.json({ success: true });
}
