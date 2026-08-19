import fs from "fs/promises";
import path from "path";

export interface ProcessedDocument {
  text: string;
  fileName: string;
  mimeType: string;
  pageCount?: number;
}

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB ?? "100", 10)) * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword",                                                       // .doc
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/vnd.ms-powerpoint",                                            // .ppt (legacy)
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",       // .xlsx
  "application/vnd.ms-excel",                                                 // .xls
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "text/csv",
  "text/html",
  "application/rtf",
  "text/rtf",
  "application/vnd.oasis.opendocument.text",         // .odt
  "application/vnd.oasis.opendocument.presentation", // .odp
  "application/vnd.oasis.opendocument.spreadsheet",  // .ods
]);

const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".docx", ".doc", ".pptx", ".ppt",
  ".xlsx", ".xls", ".csv",
  ".txt", ".md", ".html", ".htm", ".rtf",
  ".odt", ".odp", ".ods",
]);

export function validateFile(
  fileName: string,
  fileSize: number,
  mimeType: string
): { valid: boolean; error?: string } {
  const ext = path.extname(fileName).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(mimeType) && !ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: "Nicht unterstütztes Dateiformat. Erlaubt: PDF, Word (DOCX/DOC), PowerPoint (PPTX/PPT), Excel (XLSX/XLS), CSV, TXT, Markdown, HTML, RTF, OpenDocument.",
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

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ProcessedDocument> {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".pdf" || mimeType === "application/pdf") {
    return extractFromPdf(buffer, fileName);
  }

  if (ext === ".docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return extractFromDocx(buffer, fileName);
  }

  if (ext === ".doc" || mimeType === "application/msword") {
    return extractFromDoc(buffer, fileName);
  }

  if (ext === ".pptx" || mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
    return extractFromPptx(buffer, fileName);
  }

  if (ext === ".ppt" || mimeType === "application/vnd.ms-powerpoint") {
    return extractFromPptLegacy(buffer, fileName);
  }

  if (ext === ".xlsx" || mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return extractFromXlsx(buffer, fileName);
  }

  if (ext === ".xls" || mimeType === "application/vnd.ms-excel") {
    return extractFromXlsx(buffer, fileName);
  }

  if (ext === ".csv" || mimeType === "text/csv") {
    return extractFromCsv(buffer, fileName);
  }

  if (ext === ".html" || ext === ".htm" || mimeType === "text/html") {
    return extractFromHtml(buffer, fileName);
  }

  if (ext === ".rtf" || mimeType === "application/rtf" || mimeType === "text/rtf") {
    return extractFromRtf(buffer, fileName);
  }

  if (ext === ".odt" || mimeType === "application/vnd.oasis.opendocument.text") {
    return extractFromOdt(buffer, fileName);
  }

  if (ext === ".odp" || mimeType === "application/vnd.oasis.opendocument.presentation") {
    return extractFromOdp(buffer, fileName);
  }

  if (ext === ".ods" || mimeType === "application/vnd.oasis.opendocument.spreadsheet") {
    return extractFromOds(buffer, fileName);
  }

  if (ext === ".txt" || ext === ".md" || mimeType.startsWith("text/")) {
    return { text: buffer.toString("utf-8"), fileName, mimeType };
  }

  throw new Error(`Unbekanntes Dateiformat: ${ext}`);
}

// ── Text truncation — prevents OOM on huge documents ────────────────────────
const MAX_EXTRACTED_CHARS = 120_000; // ~90 pages of dense text, enough for any extraction

function truncate(text: string): string {
  if (text.length <= MAX_EXTRACTED_CHARS) return text;
  return text.slice(0, MAX_EXTRACTED_CHARS) + "\n\n[Dokument wurde für die KI-Verarbeitung auf 120.000 Zeichen gekürzt.]";
}

// ─── PDF ────────────────────────────────────────────────────────────────────

async function extractFromPdf(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  try {
    // pdf-parse v2: class-based API — new PDFParse({ data: buffer }).getText()
    const { PDFParse } = await import("pdf-parse") as unknown as {
      PDFParse: new (opts: { data: Buffer }) => { getText(): Promise<{ text: string; pages?: number }> };
    };
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text ?? "";
    if (!text.trim()) {
      throw new Error("Das PDF enthält keine Textebene (gescannte Seiten). Bitte verwenden Sie eine durchsuchbare PDF-Version oder exportieren Sie das Dokument als DOCX.");
    }
    return { text: truncate(text), fileName, mimeType: "application/pdf", pageCount: result.pages };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`PDF konnte nicht verarbeitet werden: ${message}`);
  }
}

// ─── DOCX ───────────────────────────────────────────────────────────────────

async function extractFromDocx(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return { text: truncate(result.value), fileName, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`DOCX konnte nicht verarbeitet werden: ${message}`);
  }
}

// ─── DOC (Legacy Word) ──────────────────────────────────────────────────────
// .doc is a binary format — mammoth handles it via the same API

async function extractFromDoc(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  try {
    const mammoth = await import("mammoth");
    // mammoth accepts .doc buffers as well
    const result = await mammoth.extractRawText({ buffer });
    if (result.value.trim()) {
      return { text: result.value, fileName, mimeType: "application/msword" };
    }
    // If mammoth can't read it (old binary .doc), fall back to best-effort text extraction
    const fallback = buffer.toString("utf-8").replace(/[^\x20-\x7E\xC0-\xFF\n\t]/g, " ").replace(/\s{3,}/g, "\n").trim();
    return { text: fallback, fileName, mimeType: "application/msword" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`DOC konnte nicht verarbeitet werden: ${message}. Tipp: Speichern Sie die Datei als .docx und laden Sie sie erneut hoch.`);
  }
}

// ─── PPTX ───────────────────────────────────────────────────────────────────

async function extractFromPptx(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    const textParts: string[] = [];

    // Slides
    const slideFiles = Object.keys(zip.files)
      .filter((name) => name.match(/ppt\/slides\/slide\d+\.xml/) && !name.includes("slideLayout"))
      .sort();

    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async("string");
      const matches = content.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g);
      for (const m of matches) if (m[1].trim()) textParts.push(m[1].trim());
    }

    // Speaker notes
    const noteFiles = Object.keys(zip.files)
      .filter((name) => name.match(/ppt\/notesSlides\/notesSlide\d+\.xml/))
      .sort();

    for (const noteFile of noteFiles) {
      const content = await zip.files[noteFile].async("string");
      const matches = content.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g);
      for (const m of matches) if (m[1].trim()) textParts.push(m[1].trim());
    }

    const text = textParts.join("\n");
    if (!text.trim()) {
      return {
        text: `[Datei: ${fileName} – Folien enthalten ausschließlich grafische Elemente, SmartArt oder eingebettete Bilder ohne erkannte Textebene.]`,
        fileName,
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      };
    }
    return { text: truncate(text), fileName, mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`PPTX konnte nicht verarbeitet werden: ${message}`);
  }
}

// ─── PPT (Legacy PowerPoint) ─────────────────────────────────────────────────

async function extractFromPptLegacy(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  // .ppt is a binary format — best-effort text extraction via string scan
  const raw = buffer.toString("latin1");
  const parts: string[] = [];
  // PowerPoint stores text in runs prefixed with specific byte patterns
  const matches = raw.matchAll(/[\x20-\x7E\xC0-\xFF]{10,}/g);
  for (const m of matches) {
    const cleaned = m[0].replace(/[^\x20-\x7E]/g, " ").trim();
    if (cleaned.length > 15 && !/^\s*[^a-zA-ZäöüÄÖÜ]{5,}\s*$/.test(cleaned)) {
      parts.push(cleaned);
    }
  }
  const text = parts.join("\n");
  if (!text.trim()) {
    throw new Error("PPT (Legacy-Format) konnte nicht gelesen werden. Bitte speichern Sie die Datei als .pptx und laden Sie sie erneut hoch.");
  }
  return { text, fileName, mimeType: "application/vnd.ms-powerpoint" };
}

// ─── XLSX / XLS ─────────────────────────────────────────────────────────────

async function extractFromXlsx(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  try {
    const XLSX = (await import("xlsx")).default ?? (await import("xlsx"));
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const parts: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
      if (csv.trim()) {
        parts.push(`[Tabellenblatt: ${sheetName}]\n${csv}`);
      }
    }

    const text = parts.join("\n\n");
    if (!text.trim()) throw new Error("Keine lesbaren Daten gefunden.");
    return { text: truncate(text), fileName, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Excel-Datei konnte nicht verarbeitet werden: ${message}`);
  }
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

async function extractFromCsv(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  // Detect encoding: try UTF-8, fall back to latin-1
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder("latin1").decode(buffer);
  }
  return { text, fileName, mimeType: "text/csv" };
}

// ─── HTML ────────────────────────────────────────────────────────────────────

async function extractFromHtml(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  try {
    const { NodeHtmlMarkdown } = await import("node-html-markdown");
    const html = buffer.toString("utf-8");
    const text = NodeHtmlMarkdown.translate(html);
    return { text, fileName, mimeType: "text/html" };
  } catch (error) {
    // Fallback: strip tags manually
    const html = buffer.toString("utf-8");
    const text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\s{2,}/g, "\n").trim();
    const message = error instanceof Error ? error.message : String(error);
    if (!text) throw new Error(`HTML konnte nicht verarbeitet werden: ${message}`);
    return { text, fileName, mimeType: "text/html" };
  }
}

// ─── RTF ─────────────────────────────────────────────────────────────────────

async function extractFromRtf(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  const raw = buffer.toString("latin1");
  // Remove control words first, then braces — avoids accidentally deleting the whole document
  // when the outer group contains no nested braces
  const text = raw
    .replace(/\\[a-z]+\d*[ ]?/g, " ")   // control words: \par \b \fs24 etc.
    .replace(/\\\*/g, "")                // \* (ignorable destinations)
    .replace(/[{}\\]/g, " ")             // remaining braces and backslashes
    .replace(/\s{2,}/g, "\n")
    .trim();
  if (!text) throw new Error("RTF konnte nicht gelesen werden.");
  return { text, fileName, mimeType: "application/rtf" };
}

// ─── ODT (OpenDocument Text) ─────────────────────────────────────────────────

async function extractFromOdt(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  return extractFromOpenDocument(buffer, fileName, "content.xml", "application/vnd.oasis.opendocument.text");
}

// ─── ODP (OpenDocument Presentation) ────────────────────────────────────────

async function extractFromOdp(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  return extractFromOpenDocument(buffer, fileName, "content.xml", "application/vnd.oasis.opendocument.presentation");
}

// ─── ODS (OpenDocument Spreadsheet) ─────────────────────────────────────────

async function extractFromOds(buffer: Buffer, fileName: string): Promise<ProcessedDocument> {
  return extractFromOpenDocument(buffer, fileName, "content.xml", "application/vnd.oasis.opendocument.spreadsheet");
}

async function extractFromOpenDocument(
  buffer: Buffer,
  fileName: string,
  contentFile: string,
  mimeType: string
): Promise<ProcessedDocument> {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    const content = zip.files[contentFile];
    if (!content) throw new Error(`Datei '${contentFile}' nicht gefunden.`);
    const xml = await content.async("string");
    // Extract all text:p and text:span content
    const matches = xml.matchAll(/<text:[ps][^>]*>([^<]*)<\/text:[ps]>/g);
    const parts: string[] = [];
    for (const m of matches) if (m[1].trim()) parts.push(m[1].trim());
    const text = parts.join("\n");
    if (!text.trim()) throw new Error("Keine lesbaren Textinhalte gefunden.");
    return { text, fileName, mimeType };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenDocument-Datei konnte nicht verarbeitet werden: ${message}`);
  }
}

export async function deleteTemporaryFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File may already be deleted, ignore
  }
}
