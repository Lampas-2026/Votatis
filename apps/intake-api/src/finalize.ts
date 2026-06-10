import { and, eq } from "drizzle-orm";
import type { Env } from "./types";
import type { AttachmentRecord } from "./db/schema";
import { reports } from "./db/schema";
import { getDb } from "./db/client";
import { detectImageType, ALLOWED_MIME, MAX_FILE_BYTES } from "./validation";
import { sha256Hex } from "./util";

export type FinalizeResult =
  | { ok: true; report_id: string; attachments: AttachmentRecord[] }
  | { ok: false; status: 400 | 403 | 404; error: string };

/**
 * 업로드 완료 후 확정. staging 객체를 서버가 직접 읽어 magic bytes·크기 검증 + SHA-256 계산하고,
 * 정식 key 로 옮긴 뒤 D1 레코드를 status='unverified' 로 UPDATE 한다(finalize_token/staging 비움).
 * GitHub Issue 는 더 이상 만들지 않는다.
 */
export async function finalizeSubmission(
  env: Env,
  submissionId: string,
  token: string,
): Promise<FinalizeResult> {
  const db = getDb(env);
  const rows = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, submissionId), eq(reports.status, "pending")))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, status: 404, error: "제출을 찾을 수 없거나 만료되었습니다." };

  if (!row.finalizeToken || row.finalizeToken !== token)
    return { ok: false, status: 403, error: "finalize 토큰이 일치하지 않습니다." };

  const finalized: AttachmentRecord[] = [];
  const staging = row.staging ?? [];
  for (const s of staging) {
    const obj = await env.EVIDENCE_BUCKET.get(s.staging_key);
    if (!obj) return { ok: false, status: 400, error: `업로드되지 않은 첨부가 있습니다: ${s.filename}` };

    const bytes = new Uint8Array(await obj.arrayBuffer());
    if (bytes.byteLength > MAX_FILE_BYTES)
      return { ok: false, status: 400, error: `첨부 크기 초과: ${s.filename}` };

    // magic bytes 로 실제 타입 판별 — Content-Type 신뢰하지 않음
    const detected = detectImageType(bytes);
    if (!detected || !ALLOWED_MIME.has(detected))
      return { ok: false, status: 400, error: `허용되지 않는 파일 내용: ${s.filename}` };

    const sha256 = await sha256Hex(bytes);

    // 정식 key 로 이동(copy). 검증 통과분만 정식 경로에 둔다.
    await env.EVIDENCE_BUCKET.put(s.final_key, bytes, { httpMetadata: { contentType: detected } });

    finalized.push({ filename: s.filename, r2_key: s.final_key, sha256, mime: detected, size: bytes.byteLength });
  }

  const now = new Date().toISOString();
  await db
    .update(reports)
    .set({ status: "unverified", attachments: finalized, finalizeToken: null, staging: null, updatedAt: now })
    .where(eq(reports.id, submissionId));

  // staging 객체 정리(미완료분은 R2 lifecycle 이 정리)
  for (const s of staging) await env.EVIDENCE_BUCKET.delete(s.staging_key);

  return { ok: true, report_id: submissionId, attachments: finalized };
}
