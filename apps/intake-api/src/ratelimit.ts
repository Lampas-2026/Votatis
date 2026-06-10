import { eq } from "drizzle-orm";
import type { DB } from "./db/client";
import { rateLimits } from "./db/schema";

// 고정 윈도우 rate limit (IP 기준). KV 제거에 따라 D1 로 이전.
// 결과적 일관성/정밀 카운팅은 아니지만 MVP 남용 방지에는 충분하다.
const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 10;

export async function checkRateLimit(db: DB, ip: string | null): Promise<boolean> {
  const key = `rl:${ip ?? "noip"}`;
  const now = Math.floor(Date.now() / 1000);

  const rows = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);
  const row = rows[0];

  if (!row || row.expiresAt <= now) {
    // 윈도우 시작(없거나 만료) → 카운트 1 로 리셋
    await db
      .insert(rateLimits)
      .values({ key, count: 1, expiresAt: now + WINDOW_SECONDS })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: { count: 1, expiresAt: now + WINDOW_SECONDS },
      });
    return true;
  }

  if (row.count >= MAX_REQUESTS) return false;

  await db.update(rateLimits).set({ count: row.count + 1 }).where(eq(rateLimits.key, key));
  return true;
}
