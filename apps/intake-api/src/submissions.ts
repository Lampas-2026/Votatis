import type { Env, PendingSubmission, SubmissionInput } from "./types";
import { corsHeaders, isOriginAllowed } from "./cors";
import { verifyTurnstile } from "./turnstile";
import { checkRateLimit } from "./ratelimit";
import { validateSubmission } from "./validation";
import { presignPut } from "./r2-presign";
import { anonSubmitterId, clientIp, errorJson, json, randomId, sanitizeFilename } from "./util";

const PENDING_TTL_SECONDS = 3600; // 1h. staging R2 lifecycle 와 정합 필요.

/** POST /submissions — 제출 개시. presigned 업로드 URL과 finalize 토큰을 발급한다. */
export async function handleSubmissions(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("Origin");
  const cors = corsHeaders(env, origin);
  if (!isOriginAllowed(env, origin)) return errorJson("허용되지 않은 오리진입니다.", 403, cors);

  const ip = clientIp(request);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorJson("JSON 파싱 실패.", 400, cors);
  }

  const result = validateSubmission(raw);
  if (!result.ok) return errorJson(result.error, 400, cors);
  const input: SubmissionInput = result.value;

  // Turnstile 검증 (presigned 발급 전 필수)
  const human = await verifyTurnstile(env.TURNSTILE_SECRET, input.turnstile_token, ip);
  if (!human) return errorJson("Turnstile 검증 실패.", 403, cors);

  // IP 기준 rate limit
  const allowed = await checkRateLimit(env, ip);
  if (!allowed) return errorJson("요청이 너무 많습니다.", 429, cors);

  const submissionId = randomId();
  const finalizeToken = randomId() + randomId();
  const submitter = await anonSubmitterId(ip, request.headers.get("User-Agent"));
  const collectedAt = new Date().toISOString();

  const staging: PendingSubmission["staging"] = [];
  const uploads: { staging_key: string; put_url: string }[] = [];
  for (const a of input.attachments ?? []) {
    const safe = sanitizeFilename(a.filename);
    const stagingKey = `_staging/${submissionId}/${safe}`;
    const finalKey = `${input.election}/${submissionId}/${safe}`;
    const putUrl = await presignPut(env, stagingKey);
    staging.push({ staging_key: stagingKey, final_key: finalKey, filename: safe, mime: a.mime, size: a.size });
    uploads.push({ staging_key: stagingKey, put_url: putUrl });
  }

  const { turnstile_token: _omit, ...inputNoToken } = input;
  const pending: PendingSubmission = {
    submission_id: submissionId,
    finalize_token: finalizeToken,
    submitter,
    collected_at: collectedAt,
    input: inputNoToken,
    staging,
  };
  await env.PENDING_KV.put(`pending:${submissionId}`, JSON.stringify(pending), {
    expirationTtl: PENDING_TTL_SECONDS,
  });

  return json(
    { submission_id: submissionId, finalize_token: finalizeToken, uploads },
    200,
    cors,
  );
}
