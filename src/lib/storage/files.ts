import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string
): Promise<{ storedName: string; fileSize: number }> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  const ext = path.extname(originalName).toLowerCase();
  const storedName = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(STORAGE_DIR, storedName), buffer);
  return { storedName, fileSize: buffer.length };
}

export async function readUploadedFile(storedName: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(STORAGE_DIR, storedName));
  } catch {
    return null;
  }
}

export async function deleteUploadedFile(storedName: string): Promise<void> {
  try {
    await fs.unlink(path.join(STORAGE_DIR, storedName));
  } catch {
    // File may already be absent — not an error
  }
}
