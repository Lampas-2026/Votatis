// intake-api 클라이언트 — openapi-fetch + openapi-typescript(생성 타입).
// 경로/바디/응답이 schema.d.ts(=intake-api openapi.json)에서 타입체크된다.
// presigned PUT(R2 직접 업로드)만 OpenAPI 스펙 밖이라 별도 fetch.

import createClient from "openapi-fetch";
import type { paths, components } from "./schema";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

/** intake-api validation 과 일치시킨 제약(클라 측 사전 검증용). */
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_ATTACHMENTS = 10;

export type SubmissionInput = components["schemas"]["SubmissionInput"];
export type FinalizeResult = components["schemas"]["FinalizeResult"];
export type Source = components["schemas"]["Source"];

const client = createClient<paths>({ baseUrl: API_BASE_URL });

/** 단계별로 구분 가능한 API 에러. */
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

function errMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "error" in error) {
    const e = (error as { error?: unknown }).error;
    if (typeof e === "string") return e;
  }
  return fallback;
}

export type ProgressPhase = "submitting" | "uploading" | "finalizing";

/**
 * 전 흐름: 제출 개시(POST /submissions) → presigned PUT 업로드 → finalize.
 * files 는 input.attachments 와 같은 순서·길이여야 한다(uploads 가 그 순서로 발급됨).
 */
export async function submitReport(
  input: SubmissionInput,
  files: File[],
  onProgress?: (phase: ProgressPhase, detail?: string) => void,
): Promise<FinalizeResult> {
  onProgress?.("submitting");
  const created = await client.POST("/submissions", { body: input });
  if (created.error || !created.data) {
    throw new ApiError(created.response.status, errMessage(created.error, "제출에 실패했습니다."), "submit");
  }

  const uploads = created.data.uploads;
  for (let i = 0; i < uploads.length; i++) {
    const file = files[i];
    if (!file) continue;
    onProgress?.("uploading", `${i + 1}/${uploads.length}`);
    // presigned PUT 은 서명에 Content-Type 미포함 — 원본 바이트만 직접 PUT(R2).
    const res = await fetch(uploads[i].put_url, { method: "PUT", body: file });
    if (!res.ok) {
      throw new ApiError(res.status, `첨부 업로드에 실패했습니다 (HTTP ${res.status}).`, "upload");
    }
  }

  onProgress?.("finalizing");
  const finalized = await client.POST("/submissions/{id}/finalize", {
    params: { path: { id: created.data.submission_id } },
    body: { finalize_token: created.data.finalize_token },
  });
  if (finalized.error || !finalized.data) {
    throw new ApiError(finalized.response.status, errMessage(finalized.error, "확정에 실패했습니다."), "finalize");
  }
  return finalized.data;
}
