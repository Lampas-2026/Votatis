// intake-api(0001) 클라이언트. 2단계 업로드 흐름을 오케스트레이션한다.
// 계약 출처: apps/intake-api/src/openapi.ts, validation.ts

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? "http://localhost:8787";

/** intake-api validation.ts 와 일치시킨 제약 */
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_ATTACHMENTS = 10;

export type AllowedMime = (typeof ALLOWED_MIME)[number];

export interface Source {
  /** url 또는 text 중 최소 하나 필요 */
  url?: string;
  text?: string;
  type?: "news" | "official" | "social" | "submitter" | "crawler";
  captured_at?: string;
  archive_url?: string;
}

export interface Region {
  sido?: string;
  sigungu?: string;
  eup_myeon_dong?: string;
}

export interface AttachmentInput {
  filename: string;
  mime: string;
  size: number;
  /** 클라 추정값(참고용). 정본은 서버가 finalize 시 계산하므로 생략한다. */
  sha256?: string;
}

export interface SubmissionInput {
  election: string;
  title: string;
  summary?: string;
  body?: string;
  region?: Region;
  occurred_at?: string;
  tags?: string[];
  sources?: Source[];
  attachments?: AttachmentInput[];
  /** 클라이언트가 추출한 EXIF 요약. 원본 이미지는 서버를 경유하지 않는다. */
  exif?: unknown[];
  /** 익명 제보·공개 동의 여부(실명·연락처 미저장). */
  consent?: boolean;
  turnstile_token: string;
}

export interface SubmissionCreated {
  submission_id: string;
  finalize_token: string;
  uploads: { staging_key: string; put_url: string }[];
}

export interface FinalizedAttachment {
  filename: string;
  r2_key: string;
  sha256: string;
  mime: string;
  size: number;
}

export interface SubmissionFinalized {
  report_id: string;
  attachments: FinalizedAttachment[];
}

/** 단계별로 구분 가능한 API 에러. status 로 사용자 안내를 분기한다. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly phase: "submit" | "upload" | "finalize",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    /* JSON 아님 — 상태 코드 기반 메시지로 폴백 */
  }
  return `요청이 실패했습니다 (HTTP ${res.status}).`;
}

/** (1) POST /submissions — presigned URL·finalize 토큰 발급 */
async function createSubmission(input: SubmissionInput): Promise<SubmissionCreated> {
  const res = await fetch(`${API_BASE_URL}/submissions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new ApiError(res.status, await parseError(res), "submit");
  return (await res.json()) as SubmissionCreated;
}

/** (2) presigned PUT 로 R2 에 원본 직접 업로드 (Worker 메모리 미경유) */
async function uploadAttachment(putUrl: string, file: File): Promise<void> {
  // Content-Type 은 서명에 포함되지 않는다(r2-presign.ts). 원본 바이트만 PUT.
  const res = await fetch(putUrl, { method: "PUT", body: file });
  if (!res.ok) {
    throw new ApiError(res.status, `첨부 업로드에 실패했습니다 (HTTP ${res.status}).`, "upload");
  }
}

/** (3) POST /submissions/{id}/finalize — 서버 검증·해시 후 D1 레코드 적재 */
async function finalizeSubmission(
  submissionId: string,
  finalizeToken: string,
): Promise<SubmissionFinalized> {
  const res = await fetch(
    `${API_BASE_URL}/submissions/${encodeURIComponent(submissionId)}/finalize`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ finalize_token: finalizeToken }),
    },
  );
  if (!res.ok) throw new ApiError(res.status, await parseError(res), "finalize");
  return (await res.json()) as SubmissionFinalized;
}

export type ProgressPhase = "submitting" | "uploading" | "finalizing";

/**
 * 전 흐름 실행: 제출 개시 → 첨부 업로드 → finalize.
 * files 는 input.attachments 와 같은 순서·길이여야 한다(uploads 가 그 순서로 발급됨).
 */
export async function submitReport(
  input: SubmissionInput,
  files: File[],
  onProgress?: (phase: ProgressPhase, detail?: string) => void,
): Promise<SubmissionFinalized> {
  onProgress?.("submitting");
  const created = await createSubmission(input);

  // uploads[i] 는 attachments[i] 와 1:1 대응 (서버가 요청 순서대로 발급)
  for (let i = 0; i < created.uploads.length; i++) {
    const file = files[i];
    if (!file) continue;
    onProgress?.("uploading", `${i + 1}/${created.uploads.length}`);
    await uploadAttachment(created.uploads[i].put_url, file);
  }

  onProgress?.("finalizing");
  return finalizeSubmission(created.submission_id, created.finalize_token);
}
