import { and, count, desc, eq, gte, lte, ne, sql, type SQL } from "drizzle-orm";
import type { z } from "@hono/zod-openapi";
import type { Env } from "./types";
import type { ReportListQuerySchema } from "./schemas";
import { reports } from "./db/schema";
import { getDb } from "./db/client";
import { toPublicReport, toSummary } from "./reports-map";

type ListQuery = z.infer<typeof ReportListQuerySchema>;

/** 조회 공통: pending 내부상태는 절대 노출하지 않는다 + 쿼리 필터. */
function buildWhere(q: Partial<ListQuery>): SQL | undefined {
  const conds: SQL[] = [ne(reports.status, "pending")];
  if (q.status) conds.push(eq(reports.status, q.status));
  if (q.election) conds.push(eq(reports.election, q.election));
  if (q.sido) conds.push(eq(reports.sido, q.sido));
  if (q.sigungu) conds.push(eq(reports.sigungu, q.sigungu));
  if (q.from) conds.push(gte(reports.occurredAt, q.from));
  if (q.to) conds.push(lte(reports.occurredAt, q.to));
  if (q.tag) {
    // tags 는 JSON 배열 텍스트(["a","b"]). 따옴표로 감싼 정확 토큰 매칭. 값의 따옴표는 제거(주입 방지).
    const needle = `%"${q.tag.replace(/"/g, "")}"%`;
    conds.push(sql`${reports.tags} LIKE ${needle}`);
  }
  return and(...conds);
}

export async function listReports(env: Env, q: ListQuery) {
  const db = getDb(env);
  const where = buildWhere(q);

  const totalRows = await db.select({ c: count() }).from(reports).where(where);
  const total = totalRows[0]?.c ?? 0;

  const rows = await db
    .select()
    .from(reports)
    .where(where)
    .orderBy(desc(reports.collectedAt))
    .limit(q.limit)
    .offset(q.offset);

  return { items: rows.map(toSummary), total, limit: q.limit, offset: q.offset };
}

export async function getReport(env: Env, id: string) {
  const db = getDb(env);
  const rows = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, id), ne(reports.status, "pending")))
    .limit(1);
  const row = rows[0];
  return row ? toPublicReport(row) : null;
}
