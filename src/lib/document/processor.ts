import fs from "fs/promises";
import path from "path";

export interface ProcessedDocument {
  text: string;
  fileName: string;
  mimeType: string;
  pageCount?: number;
}

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/tmp/ai-asset-factory-uploads";
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB ?? "10", 10)) * 1024 * 1024;

export function validateFile(
  fileName: string,
  fileSize: number,
  mimeType: string
): { valid: boolean; error?: string } {
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/markdown",
    "text/x-markdown",
  ];

  const allowedExtensions = [".pdf", ".docx", ".pptx", ".txt", ".md"];
  const ext = path.extname(fileName).toLowerCase();

  if (!allowed.includes(mimeType) && !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Nicht unterstütztes Dateiformat. Erlaubt sind: PDF, DOCX, PPTX, TXT, Markdown.`,
    };
  }

  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Datei zu groß. Maximal ${process.env.MAX_FILE_SIZE_MB ?? "10"} MB erlaubt.`,
    };
  }

  return { valid: true };
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ProcessedDocument> {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".pdf" || mimeType === "application/pdf") {
    return extractFromPdf(buffer, fileName);
  }

  if (
    ext === ".docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractFromDocx(buffer, fileName);
  }

  if (ext === ".txt" || ext === ".md" || mimeType.startsWith("text/")) {
    return {
      text: buffer.toString("utf-8"),
      fileName,
      mimeType,
    };
  }

  if (
    ext === ".pptx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return extractFromPptx(buffer, fileName);
  }

  throw new Error(`Unbekanntes Dateiformat: ${ext}`);
}

async function extractFromPdf(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  try {
    // Dynamic import to avoid issues during build
    const pdfModule = await import("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = ((pdfModule as any).default ?? pdfModule) as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      fileName,
      mimeType: "application/pdf",
      pageCount: data.numpages,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`PDF konnte nicht verarbeitet werden: ${message}`);
  }
}

async function extractFromDocx(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      fileName,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`DOCX konnte nicht verarbeitet werden: ${message}`);
  }
}

async function extractFromPptx(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  // Basic PPTX text extraction via ZIP parsing
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    const textParts: string[] = [];

    const slideFiles = Object.keys(zip.files).filter(
      (name) => name.match(/ppt\/slides\/slide\d+\.xml/) && !name.includes("slideLayout")
    );

    slideFiles.sort();

    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async("string");
      // Extract text from XML
      const matches = content.matchAll(/<a:t>([^<]*)<\/a:t>/g);
      for (const match of matches) {
        if (match[1].trim()) textParts.push(match[1].trim());
      }
    }

    return {
      text: textParts.join("\n"),
      fileName,
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`PPTX konnte nicht verarbeitet werden: ${message}`);
  }
}

export async function deleteTemporaryFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File may already be deleted, ignore
  }
}
