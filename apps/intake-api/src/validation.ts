import type { SubmissionInput, AttachmentInput } from "./types";

export const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_ATTACHMENTS = 10;

/**
 * 바이트 시그니처(magic bytes)로 실제 이미지 타입을 판별한다.
 * Content-Type 헤더는 신뢰하지 않는다(위조·polyglot 방어).
 */
export function detectImageType(bytes: Uint8Array): string | null {
  const at = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (at([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (at([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (at([0x47, 0x49, 0x46, 0x38])) return "image/gif"; // GIF8
  if (at([0x52, 0x49, 0x46, 0x46]) && at([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp"; // RIFF....WEBP
  return null;
}

export type ValidationResult =
  | { ok: true; value: SubmissionInput }
  | { ok: false; error: string };

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** 입력을 PRD 스키마 기준으로 검증·정규화한다. 판단/라벨링은 하지 않는다. */
export function validateSubmission(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "본문이 올바른 JSON 객체가 아닙니다." };
  const o = raw as Record<string, unknown>;

  if (!nonEmptyString(o.election)) return { ok: false, error: "election 은 필수입니다." };
  if (!nonEmptyString(o.title)) return { ok: false, error: "title 은 필수입니다." };

  // 출처 없으면 등록 불가 (PRD 원칙2)
  if (!Array.isArray(o.sources) || o.sources.length === 0)
    return { ok: false, error: "sources 는 최소 1개 필요합니다 (출처 없는 항목은 등록 불가)." };
  for (const s of o.sources) {
    if (typeof s !== "object" || s === null || !nonEmptyString((s as Record<string, unknown>).url))
      return { ok: false, error: "각 source 에는 url 이 필요합니다." };
  }

  // 첨부 검증 (선언 단계: mime 허용목록 + 크기 + 개수). 실제 바이트 검증은 finalize.
  const attachments = (o.attachments ?? []) as AttachmentInput[];
  if (!Array.isArray(attachments)) return { ok: false, error: "attachments 형식이 잘못되었습니다." };
  if (attachments.length > MAX_ATTACHMENTS)
    return { ok: false, error: `첨부는 최대 ${MAX_ATTACHMENTS}개까지 가능합니다.` };
  for (const a of attachments) {
    if (!nonEmptyString(a.filename)) return { ok: false, error: "첨부 filename 이 필요합니다." };
    if (!ALLOWED_MIME.has(a.mime)) return { ok: false, error: `허용되지 않는 첨부 타입: ${a.mime}` };
    if (typeof a.size !== "number" || a.size <= 0 || a.size > MAX_FILE_BYTES)
      return { ok: false, error: `첨부 크기가 허용 범위를 벗어났습니다(최대 ${MAX_FILE_BYTES} bytes).` };
  }

  if (!nonEmptyString(o.turnstile_token)) return { ok: false, error: "turnstile_token 은 필수입니다." };

  return { ok: true, value: raw as SubmissionInput };
}
