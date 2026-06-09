import type { Env, PendingSubmission } from "./types";
import { corsHeaders, isOriginAllowed } from "./cors";
import { detectImageType, ALLOWED_MIME, MAX_FILE_BYTES } from "./validation";
import { buildIssueBody, createIssue, type FinalizedAttachment } from "./github";
import { errorJson, json, sha256Hex } from "./util";

/**
 * POST /submissions/:id/finalize — 업로드 완료 후 호출.
 * staging 객체를 서버가 직접 읽어 검증·해시하고, 정식 key로 옮긴 뒤 Issue를 만든다.
 * 미완료 제출의 staging 객체/KV 항목은 R2 lifecycle/KV TTL로 자동 정리된다.
 */
export async function handleFinalize(request: Request, env: Env, submissionId: string): Promise<Response> {
  const origin = request.headers.get("Origin");
  const cors = corsHeaders(env, origin);
  if (!isOriginAllowed(env, origin)) return errorJson("허용되지 않은 오리진입니다.", 403, cors);

  let body: { finalize_token?: string };
  try {
    body = (await request.json()) as { finalize_token?: string };
  } catch {
    return errorJson("JSON 파싱 실패.", 400, cors);
  }

  const kvKey = `pending:${submissionId}`;
  const stored = await env.PENDING_KV.get(kvKey);
  if (!stored) return errorJson("제출을 찾을 수 없거나 만료되었습니다.", 404, cors);
  const pending = JSON.parse(stored) as PendingSubmission;

  if (!body.finalize_token || body.finalize_token !== pending.finalize_token)
    return errorJson("finalize 토큰이 일치하지 않습니다.", 403, cors);

  const finalized: FinalizedAttachment[] = [];
  for (const s of pending.staging) {
    const obj = await env.EVIDENCE_BUCKET.get(s.staging_key);
    if (!obj) return errorJson(`업로드되지 않은 첨부가 있습니다: ${s.filename}`, 400, cors);

    const bytes = new Uint8Array(await obj.arrayBuffer());
    if (bytes.byteLength > MAX_FILE_BYTES)
      return errorJson(`첨부 크기 초과: ${s.filename}`, 400, cors);

    // magic bytes 로 실제 타입 판별 — Content-Type 신뢰하지 않음
    const detected = detectImageType(bytes);
    if (!detected || !ALLOWED_MIME.has(detected))
      return errorJson(`허용되지 않는 파일 내용: ${s.filename}`, 400, cors);

    const sha256 = await sha256Hex(bytes);

    // 정식 key 로 이동(copy). 검증 통과분만 정식 경로에 둔다.
    await env.EVIDENCE_BUCKET.put(s.final_key, bytes, {
      httpMetadata: { contentType: detected },
    });

    finalized.push({
      filename: s.filename,
      r2_key: s.final_key,
      sha256,
      mime: detected,
      size: bytes.byteLength,
    });
  }

  // Issue 생성 (PRD 스키마 포맷). baseUrl 은 시뮬레이션 모드에서 가짜 issue_url 생성에 쓰인다.
  const issueBody = buildIssueBody(pending, finalized);
  const baseUrl = new URL(request.url).origin;
  const issueUrl = await createIssue(env, pending.input.title, issueBody, ["unverified"], baseUrl);

  // staging 정리 + pending 삭제
  for (const s of pending.staging) await env.EVIDENCE_BUCKET.delete(s.staging_key);
  await env.PENDING_KV.delete(kvKey);

  return json({ submission_id: submissionId, issue_url: issueUrl, attachments: finalized }, 200, cors);
}
