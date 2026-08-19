const windows = new Map<string, number[]>();

const WINDOW_MS = 60_000;
// Evict entries that haven't been touched in 5 minutes to prevent unbounded growth.
const EVICT_AFTER_MS = 5 * 60_000;
const lastSeen = new Map<string, number>();

function evictStale(now: number) {
  for (const [userId, ts] of lastSeen) {
    if (now - ts > EVICT_AFTER_MS) {
      windows.delete(userId);
      lastSeen.delete(userId);
    }
  }
}

export function checkRateLimit(
  userId: string,
  limit: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  evictStale(now);

  const timestamps = (windows.get(userId) ?? []).filter(
    (t) => now - t < WINDOW_MS
  );

  lastSeen.set(userId, now);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    windows.set(userId, timestamps);
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest) };
  }

  timestamps.push(now);
  windows.set(userId, timestamps);
  return { allowed: true, retryAfterMs: 0 };
}
