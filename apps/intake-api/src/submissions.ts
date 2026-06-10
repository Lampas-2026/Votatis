import type { z } from "@hono/zod-openapi";
import type { Env } from "./types";
import { isLocalUpload } from "./types";
import type { SubmissionInputSchema } from "./schemas";
import type { StagingItem } from "./db/schema";
import { reports } from "./db/schema";
import { getDb } from "./db/client";
import { presignPut } from "./r2-presign";
import { anonSubmitterId, randomId, sanitizeFilename } from "./util";

type SubmissionInput = z.infer<typeof SubmissionInputSchema>;

export interface SubmissionCreated {
  submission_id: string;
  finalize_token: string;
  uploads: { staging_key: string; put_url: string }[];
}

/**
 * 제출 개시. 첨부별 presigned PUT URL 을 발급하고, pending 레코드를 D1 에 INSERT 한다.
 * (Turnstile·rate limit 검증은 라우트 핸들러가 선행한다.)
 */
export async function createSubmission(
  env: Env,
  input: SubmissionInput,
  ip: string | null,
  userAgent: string | null,
  baseUrl: string,
): Promise<SubmissionCreated> {
  const submissionId = randomId();
  const finalizeToken = randomId() + randomId();
  const submitter = await anonSubmitterId(ip, userAgent);
  const now = new Date().toISOString();

  const local = isLocalUpload(env);
  const staging: StagingItem[] = [];
  const uploads: { staging_key: string; put_url: string }[] = [];
  for (const a of input.attachments ?? []) {
    const safe = sanitizeFilename(a.filename);
    const stagingKey = `_staging/${submissionId}/${safe}`;
    const finalKey = `${input.election}/${submissionId}/${safe}`;
    // 로컬 모드: presigned(실 R2) 대신 워커 자체 업로드 경로. CF 자격증명 불필요.
    const putUrl = local
      ? `${baseUrl.replace(/\/$/, "")}/_dev/upload/${stagingKey}`
      : await presignPut(env, stagingKey);
    staging.push({ staging_key: stagingKey, final_key: finalKey, filename: safe, mime: a.mime, size: a.size });
    uploads.push({ staging_key: stagingKey, put_url: putUrl });
  }

  await getDb(env).insert(reports).values({
    id: submissionId,
    status: "pending",
    election: input.election,
    title: input.title,
    summary: input.summary ?? null,
    body: input.body ?? null,
    sido: input.region?.sido ?? null,
    sigungu: input.region?.sigungu ?? null,
    eupMyeonDong: input.region?.eup_myeon_dong ?? null,
    occurredAt: input.occurred_at ?? null,
    collectedAt: now,
    tags: input.tags ?? [],
    sources: input.sources ?? [],
    attachments: [],
    exif: input.exif ?? null,
    rebuttals: null,
    related: null,
    consent: input.consent ?? null,
    submitter,
    license: "CC-BY-4.0",
    verificationReviewer: null,
    verificationMethod: null,
    verificationReviewedAt: null,
    verificationNotes: null,
    verificationEvidenceLinks: null,
    finalizeToken,
    staging,
    createdAt: now,
    updatedAt: now,
  });

  return { submission_id: submissionId, finalize_token: finalizeToken, uploads };
}
