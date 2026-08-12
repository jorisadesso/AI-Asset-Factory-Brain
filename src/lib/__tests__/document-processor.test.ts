import { validateFile } from "../document/processor";

describe("validateFile", () => {
  const MB = 1024 * 1024;

  it("accepts valid PDF", () => {
    const result = validateFile("document.pdf", "application/pdf", 5 * MB);
    expect(result.valid).toBe(true);
  });

  it("accepts valid DOCX", () => {
    const result = validateFile(
      "document.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      2 * MB
    );
    expect(result.valid).toBe(true);
  });

  it("rejects unsupported extension", () => {
    const result = validateFile("document.exe", "application/octet-stream", 1 * MB);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("nicht unterstützt");
  });

  it("rejects file over size limit", () => {
    const result = validateFile("document.pdf", "application/pdf", 15 * MB);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("groß");
  });

  it("accepts markdown files", () => {
    const result = validateFile("notes.md", "text/markdown", 100 * 1024);
    expect(result.valid).toBe(true);
  });

  it("accepts text files", () => {
    const result = validateFile("notes.txt", "text/plain", 50 * 1024);
    expect(result.valid).toBe(true);
  });
});
