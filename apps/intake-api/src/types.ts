export interface Env {
  // Bindings
  EVIDENCE_BUCKET: R2Bucket;
  PENDING_KV: KVNamespace;

  // Vars
  ALLOWED_ORIGIN: string;
  GITHUB_REPO: string; // "owner/repo"
  R2_ACCOUNT_ID: string;
  R2_BUCKET: string;

  // Secrets
  TURNSTILE_SECRET: string;
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string; // PEM (PKCS#1 또는 PKCS#8)
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;

  // Dev 전용 토글 (.dev.vars 에만 둔다. 운영 미설정)
  SIMULATE_GITHUB?: string; // "true"/"1" 이면 GitHub Issue 생성을 시뮬레이션
}

export interface SourceInput {
  url?: string; // 웹사이트 출처. url 또는 text 중 하나 이상 필요.
  text?: string; // 직접 입력한 출처(증언·설명 등). url 없이 단독 가능.
  type?: string; // news | official | social | submitter | crawler
  captured_at?: string;
  archive_url?: string;
}

export interface AttachmentInput {
  filename: string;
  mime: string;
  size: number;
  sha256?: string; // 클라이언트 추정값. 참고용이며 정본은 서버가 계산한다.
}

export interface RegionInput {
  sido?: string;
  sigungu?: string;
  eup_myeon_dong?: string;
}

/** 클라이언트가 보내는 제출 요청 본문. */
export interface SubmissionInput {
  election: string;
  title: string;
  summary?: string;
  body?: string;
  region?: RegionInput;
  occurred_at?: string;
  tags?: string[];
  sources?: SourceInput[]; // 출처(URL/텍스트) 또는 attachments 중 최소 하나 필요.
  attachments?: AttachmentInput[];
  exif?: unknown[]; // 클라이언트가 추출한 EXIF 요약. 원본 이미지는 서버를 경유하지 않는다.
  consent?: boolean; // 익명 제보·공개 동의 여부(실명·연락처는 미저장).
  turnstile_token: string;
}

/** KV에 저장하는 pending 제출 상태. */
export interface PendingSubmission {
  submission_id: string;
  finalize_token: string;
  submitter: string; // 익명 해시
  collected_at: string;
  input: Omit<SubmissionInput, "turnstile_token">;
  staging: { staging_key: string; final_key: string; filename: string; mime: string; size: number }[];
}
