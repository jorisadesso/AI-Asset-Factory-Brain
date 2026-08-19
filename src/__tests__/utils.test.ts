import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── rateLimit ────────────────────────────────────────────────────────────────

// Inline the implementation so tests don't depend on module-level Map state
function makeRateLimiter(windowMs = 60_000, evictAfterMs = 300_000) {
  const windows = new Map<string, number[]>();
  const lastSeen = new Map<string, number>();

  function evictStale(now: number) {
    for (const [userId, ts] of lastSeen) {
      if (now - ts > evictAfterMs) {
        windows.delete(userId);
        lastSeen.delete(userId);
      }
    }
  }

  return function checkRateLimit(userId: string, limit: number, now = Date.now()) {
    evictStale(now);
    const timestamps = (windows.get(userId) ?? []).filter((t) => now - t < windowMs);
    lastSeen.set(userId, now);
    if (timestamps.length >= limit) {
      windows.set(userId, timestamps);
      return { allowed: false, retryAfterMs: windowMs - (now - timestamps[0]) };
    }
    timestamps.push(now);
    windows.set(userId, timestamps);
    return { allowed: true, retryAfterMs: 0 };
  };
}

describe("checkRateLimit", () => {
  it("allows requests below the limit", () => {
    const check = makeRateLimiter();
    expect(check("u1", 3, 1000).allowed).toBe(true);
    expect(check("u1", 3, 2000).allowed).toBe(true);
    expect(check("u1", 3, 3000).allowed).toBe(true);
  });

  it("blocks when limit is reached", () => {
    const check = makeRateLimiter();
    check("u1", 2, 1000);
    check("u1", 2, 2000);
    const result = check("u1", 2, 3000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("allows again after the window expires", () => {
    const check = makeRateLimiter(1000);
    check("u1", 1, 0);
    expect(check("u1", 1, 500).allowed).toBe(false);
    expect(check("u1", 1, 1001).allowed).toBe(true);
  });

  it("tracks different users independently", () => {
    const check = makeRateLimiter();
    check("u1", 1, 1000);
    expect(check("u1", 1, 2000).allowed).toBe(false);
    expect(check("u2", 1, 2000).allowed).toBe(true);
  });

  it("evicts stale entries", () => {
    const check = makeRateLimiter(60_000, 100);
    check("u1", 1, 0);
    // after evictAfterMs, the entry should be gone so u1 is allowed again
    expect(check("u1", 1, 200).allowed).toBe(true);
  });
});

// ─── semaphore ────────────────────────────────────────────────────────────────

function createSemaphore(concurrency: number) {
  let running = 0;
  const queue: Array<() => void> = [];

  function next() {
    if (queue.length > 0 && running < concurrency) {
      running++;
      queue.shift()!();
    }
  }

  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(async () => {
        try { resolve(await fn()); }
        catch (e) { reject(e); }
        finally { running--; next(); }
      });
      next();
    });
  };
}

describe("createSemaphore", () => {
  beforeEach(() => { vi.useRealTimers(); });

  it("runs tasks and resolves their values", async () => {
    const run = createSemaphore(2);
    const result = await run(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it("propagates rejections", async () => {
    const run = createSemaphore(1);
    await expect(run(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
  });

  it("enforces concurrency limit", async () => {
    const run = createSemaphore(2);
    let concurrent = 0;
    let maxConcurrent = 0;

    const task = () =>
      run(async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((r) => setTimeout(r, 10));
        concurrent--;
      });

    await Promise.all([task(), task(), task(), task()]);
    expect(maxConcurrent).toBe(2);
  });

  it("runs all tasks even when queued", async () => {
    const run = createSemaphore(1);
    const order: number[] = [];
    await Promise.all(
      [1, 2, 3].map((n) => run(async () => { order.push(n); }))
    );
    expect(order).toEqual([1, 2, 3]);
  });

  it("continues processing after a rejection", async () => {
    const run = createSemaphore(1);
    const results: Array<number | string> = [];
    await Promise.all([
      run(() => Promise.resolve(1)).then((v) => results.push(v)),
      run(() => Promise.reject(new Error("x"))).catch(() => results.push("err")),
      run(() => Promise.resolve(3)).then((v) => results.push(v)),
    ]);
    expect(results).toEqual([1, "err", 3]);
  });
});
