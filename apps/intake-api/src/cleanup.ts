import { and, eq, lt } from "drizzle-orm";
import type { Env } from "./types";
import { reports } from "./db/schema";
import { getDb } from "./db/client";

// 만료된 pending(업로드 미완료) 레코드 정리 TTL. staging R2 객체는 R2 lifecycle 이 정리한다.
export const PENDING_TTL_MS = 60 * 60 * 1000; // 1h

/** scheduled(cron)에서 호출. createdAt 이 TTL 보다 오래된 pending 레코드를 삭제한다. */
export async function cleanupPending(env: Env, nowMs: number = Date.now()): Promise<number> {
  const cutoff = new Date(nowMs - PENDING_TTL_MS).toISOString();
  const result = await getDb(env)
    .delete(reports)
    .where(and(eq(reports.status, "pending"), lt(reports.createdAt, cutoff)));
  // D1 delete 결과의 영향 행 수(메타). 환경에 따라 형태가 달라 안전하게 접근.
  return (result as unknown as { meta?: { changes?: number } })?.meta?.changes ?? 0;
}
