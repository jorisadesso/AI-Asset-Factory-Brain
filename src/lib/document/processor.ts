import fs from "fs/promises";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/markdown",
  "application/octet-stream",
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".pptx", ".txt", ".md"];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || "10") * 1024 * 1024;

export interface ProcessingResult {
  success: boolean;
  text: string;
  error?: string;
}

export function validateFile(
  filename: string,
  mimeType: string,
  size: number
): { valid: boolean; error?: string } {
  const ext = path.extname(filename).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Dateityp nicht unterstützt. Erlaubt: ${ALLOWED_EXTENSIONS.join(", ")}` };
  }

  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: `Datei zu groß. Maximum: ${process.env.MAX_FILE_SIZE_MB || 10} MB` };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType) && mimeType !== "application/octet-stream") {
    const byExtension = ALLOWED_EXTENSIONS.includes(ext);
    if (!byExtension) {
      return { valid: false, error: "MIME-Typ nicht erlaubt" };
    }
  }

  return { valid: true };
}

export async function extractText(filePath: string, filename: string): Promise<ProcessingResult> {
  const ext = path.extname(filename).toLowerCase();

  try {
    const buffer = await fs.readFile(filePath);

    if (ext === ".txt" || ext === ".md") {
      return { success: true, text: buffer.toString("utf-8") };
    }

    if (ext === ".pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const result = await pdfParse(buffer);
      return { success: true, text: result.text };
    }

    if (ext === ".docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return { success: true, text: result.value };
    }

    if (ext === ".pptx") {
      // PPTX: extract text from XML slides
      const text = await extractPptxText(buffer);
      return { success: true, text };
    }

    return { success: false, text: "", error: "Dateiformat nicht unterstützt" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    return { success: false, text: "", error: `Fehler beim Lesen der Datei: ${message}` };
  }
}

async function extractPptxText(buffer: Buffer): Promise<string> {
  // Simple XML text extraction for PPTX
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const texts: string[] = [];

  for (const [name, file] of Object.entries(zip.files)) {
    if (name.startsWith("ppt/slides/slide") && name.endsWith(".xml")) {
      const content = await file.async("text");
      const matches = content.match(/<a:t>(.*?)<\/a:t>/g) || [];
      texts.push(...matches.map((m) => m.replace(/<[^>]+>/g, "")));
    }
  }

  return texts.join(" ");
}

export async function ensureUploadDir(): Promise<string> {
  const dir = process.env.UPLOAD_DIR || "/tmp/ai-asset-factory-uploads";
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function deleteTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File may already be deleted
  }
}
