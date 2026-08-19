import { describe, it, expect } from "vitest";

// ─── isReasoningModel helper (inline — mirrors the route logic) ───────────────
const REASONING_PREFIXES = ["o1", "o3", "o4"];
function isReasoningModel(model: string) {
  return REASONING_PREFIXES.some((p) => model === p || model.startsWith(p + "-"));
}

describe("isReasoningModel", () => {
  it("identifies o4-mini as reasoning", () => expect(isReasoningModel("o4-mini")).toBe(true));
  it("identifies o1 as reasoning", () => expect(isReasoningModel("o1")).toBe(true));
  it("identifies o3-mini as reasoning", () => expect(isReasoningModel("o3-mini")).toBe(true));
  it("does NOT flag gpt-4o as reasoning", () => expect(isReasoningModel("gpt-4o")).toBe(false));
  it("does NOT flag claude-3 as reasoning", () => expect(isReasoningModel("claude-3-sonnet")).toBe(false));
  it("does NOT flag gpt-4o-mini as reasoning", () => expect(isReasoningModel("gpt-4o-mini")).toBe(false));
});

// ─── SSE chunk format ────────────────────────────────────────────────────────
describe("SSE chunk format", () => {
  it("encodes text delta as valid SSE line", () => {
    const data = { text: "Hallo" };
    const line = `data: ${JSON.stringify(data)}\n\n`;
    expect(line).toBe('data: {"text":"Hallo"}\n\n');
    const parsed = JSON.parse(line.replace(/^data: /, "").trim()) as { text: string };
    expect(parsed.text).toBe("Hallo");
  });

  it("encodes error as valid SSE line", () => {
    const data = { error: "Timeout" };
    const line = `data: ${JSON.stringify(data)}\n\n`;
    const parsed = JSON.parse(line.replace(/^data: /, "").trim()) as { error: string };
    expect(parsed.error).toBe("Timeout");
  });

  it("[DONE] sentinel is a plain string, not JSON", () => {
    const done = "data: [DONE]\n\n";
    const payload = done.replace(/^data: /, "").trim();
    expect(payload).toBe("[DONE]");
  });
});
