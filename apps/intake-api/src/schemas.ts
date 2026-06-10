import { z } from "@hono/zod-openapi";
import { ALLOWED_MIME_LIST, MAX_ATTACHMENTS, MAX_FILE_BYTES } from "./validation";
import { PUBLIC_STATUSES } from "./types";

// ── 공통 조각 ──────────────────────────────────────────────────────────────

export const SourceSchema = z
  .object({
    url: z.string().url().optional(),
    text: z.string().min(1).optional(),
    type: z.string().optional(), // news | official | social | submitter | crawler
    captured_at: z.string().optional(),
    archive_url: z.string().url().optional(),
  })
  .refine((s) => Boolean(s.url) || Boolean(s.text), {
    message: "각 source 에는 url 또는 text 가 필요합니다.",
  })
  .openapi("Source");

export const RegionSchema = z
  .object({
    sido: z.string().optional(),
    sigungu: z.string().optional(),
    eup_myeon_dong: z.string().optional(),
  })
  .openapi("Region");

export const AttachmentInputSchema = z
  .object({
    filename: z.string().min(1),
    mime: z.enum(ALLOWED_MIME_LIST),
    size: z.number().int().positive().max(MAX_FILE_BYTES),
    sha256: z.string().optional(), // 클라 추정값. 참고용, 정본은 서버 계산
  })
  .openapi("AttachmentInput");

export const AttachmentRecordSchema = z
  .object({
    filename: z.string(),
    r2_key: z.string(),
    sha256: z.string(),
    mime: z.string(),
    size: z.number().int(),
  })
  .openapi("Attachment");

// ── 요청 ───────────────────────────────────────────────────────────────────

export const SubmissionInputSchema = z
  .object({
    election: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().optional(),
    body: z.string().optional(),
    region: RegionSchema.optional(),
    occurred_at: z.string().optional(),
    tags: z.array(z.string()).max(50).optional(),
    sources: z.array(SourceSchema).optional(),
    attachments: z.array(AttachmentInputSchema).max(MAX_ATTACHMENTS).optional(),
    exif: z.array(z.unknown()).optional(),
    consent: z.boolean().optional(),
    turnstile_token: z.string().min(1),
  })
  .refine((v) => (v.sources?.length ?? 0) > 0 || (v.attachments?.length ?? 0) > 0, {
    message: "출처(URL·텍스트) 또는 첨부 중 최소 하나가 필요합니다.",
  })
  .openapi("SubmissionInput");

export const FinalizeInputSchema = z
  .object({ finalize_token: z.string().min(1) })
  .openapi("FinalizeInput");

// ── 응답 ───────────────────────────────────────────────────────────────────

export const SubmissionCreatedSchema = z
  .object({
    submission_id: z.string(),
    finalize_token: z.string(),
    uploads: z.array(z.object({ staging_key: z.string(), put_url: z.string() })),
  })
  .openapi("SubmissionCreated");

export const FinalizeResultSchema = z
  .object({
    report_id: z.string(),
    attachments: z.array(AttachmentRecordSchema),
  })
  .openapi("FinalizeResult");

export const VerificationSchema = z
  .object({
    reviewer: z.string().nullable(),
    method: z.string().nullable(),
    reviewed_at: z.string().nullable(),
    notes: z.string().nullable(),
    evidence_links: z.array(z.string()).nullable(),
  })
  .openapi("Verification");

/** 공개 조회 응답 — submitter·finalize_token·staging 등 내부 필드는 포함하지 않는다. */
export const ReportPublicSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    election: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    body: z.string().nullable(),
    region: RegionSchema,
    occurred_at: z.string().nullable(),
    collected_at: z.string(),
    tags: z.array(z.string()),
    sources: z.array(SourceSchema),
    attachments: z.array(AttachmentRecordSchema),
    rebuttals: z.array(z.object({ text: z.string(), source_url: z.string().optional() })).nullable(),
    related: z.array(z.string()).nullable(),
    consent: z.boolean().nullable(),
    license: z.string(),
    verification: VerificationSchema,
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi("Report");

export const ReportSummarySchema = z
  .object({
    id: z.string(),
    status: z.string(),
    election: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    region: RegionSchema,
    occurred_at: z.string().nullable(),
    collected_at: z.string(),
    tags: z.array(z.string()),
    attachment_count: z.number().int(),
  })
  .openapi("ReportSummary");

export const ReportListSchema = z
  .object({
    items: z.array(ReportSummarySchema),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })
  .openapi("ReportList");

// 쿼리: 문자열로 들어오므로 limit/offset 은 coerce. status 는 공개 상태만.
export const ReportListQuerySchema = z.object({
  election: z.string().optional(),
  status: z.enum(PUBLIC_STATUSES as [string, ...string[]]).optional(),
  sido: z.string().optional(),
  sigungu: z.string().optional(),
  tag: z.string().optional(),
  from: z.string().optional(), // occurred_at >= from (ISO)
  to: z.string().optional(), // occurred_at <= to (ISO)
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const ReportIdParamSchema = z.object({
  id: z.string().min(1).openapi({ param: { name: "id", in: "path" } }),
});

export const SubmissionIdParamSchema = z.object({
  id: z.string().min(1).openapi({ param: { name: "id", in: "path" } }),
});

export const ErrorSchema = z.object({ error: z.string() }).openapi("Error");
