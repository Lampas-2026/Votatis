import { ALLOWED_MIME, MAX_ATTACHMENTS, MAX_FILE_BYTES } from "./validation";

/**
 * intake-api OpenAPI 3.1 스펙. 손으로 작성하며 실제 검증(validation.ts)·핸들러
 * (submissions.ts / finalize.ts) 동작과 일치시킨다. 라우트나 스키마를 바꾸면 여기도 갱신.
 */
export const openapiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Votatis 제보 수집 API",
    version: "0.0.0",
    description:
      "제보를 받아 첨부를 R2에 저장하고 검증 큐(GitHub Issue)로 올리는 Worker. " +
      "2단계 업로드(presigned): (1) POST /submissions 로 메타+첨부목록 제출 → presigned PUT URL 발급, " +
      "(2) 클라가 R2에 직접 PUT, (3) POST /submissions/{id}/finalize 로 서버가 바이트 검증·해시 후 Issue 생성.",
  },
  servers: [
    { url: "https://votatis-intake-api.3dulev.workers.dev", description: "production" },
    { url: "http://localhost:8787", description: "local (wrangler dev)" },
  ],
  tags: [
    { name: "submissions", description: "제보 제출 흐름" },
    { name: "ops", description: "운영" },
  ],
  paths: {
    "/submissions": {
      post: {
        tags: ["submissions"],
        summary: "제출 개시",
        description:
          "제보 메타와 첨부 목록을 받아 Turnstile 검증·IP rate limit 후 첨부별 presigned PUT URL과 finalize 토큰을 발급한다. " +
          "Origin 은 ALLOWED_ORIGIN 과 일치해야 한다.",
        operationId: "createSubmission",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SubmissionInput" } } },
        },
        responses: {
          "200": {
            description: "발급 성공",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SubmissionCreated" } } },
          },
          "400": { $ref: "#/components/responses/Error" },
          "403": { $ref: "#/components/responses/Error" },
          "429": { $ref: "#/components/responses/Error" },
        },
      },
    },
    "/submissions/{id}/finalize": {
      post: {
        tags: ["submissions"],
        summary: "제출 확정",
        description:
          "업로드 완료 후 호출. 서버가 staging 객체를 직접 읽어 magic bytes·크기 검증, SHA-256 계산 후 정식 key 로 옮기고 GitHub Issue 를 생성한다. " +
          "성공 시 pending KV 와 staging 객체는 삭제된다.",
        operationId: "finalizeSubmission",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "POST /submissions 응답의 submission_id",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/FinalizeInput" } } },
        },
        responses: {
          "200": {
            description: "확정 성공",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SubmissionFinalized" } } },
          },
          "400": { $ref: "#/components/responses/Error" },
          "403": { $ref: "#/components/responses/Error" },
          "404": { $ref: "#/components/responses/Error" },
        },
      },
    },
    "/health": {
      get: {
        tags: ["ops"],
        summary: "헬스 체크",
        operationId: "health",
        responses: {
          "200": {
            description: "정상",
            content: { "text/plain": { schema: { type: "string", example: "ok" } } },
          },
        },
      },
    },
  },
  components: {
    responses: {
      Error: {
        description: "오류",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string", description: "사람이 읽을 수 있는 오류 메시지" } },
        required: ["error"],
      },
      Source: {
        type: "object",
        description: "출처. url(웹사이트) 또는 text(직접 입력) 중 하나 이상 필요.",
        anyOf: [{ required: ["url"] }, { required: ["text"] }],
        properties: {
          url: { type: "string", format: "uri", description: "웹사이트 출처 URL" },
          text: { type: "string", description: "직접 입력한 출처(증언·설명 등). url 없이 단독 가능." },
          type: {
            type: "string",
            description: "출처 유형",
            enum: ["news", "official", "social", "submitter", "crawler"],
          },
          captured_at: { type: "string", format: "date-time" },
          archive_url: { type: "string", format: "uri" },
        },
      },
      Attachment: {
        type: "object",
        required: ["filename", "mime", "size"],
        properties: {
          filename: { type: "string" },
          mime: { type: "string", enum: [...ALLOWED_MIME], description: "허용 이미지 MIME" },
          size: {
            type: "integer",
            minimum: 1,
            maximum: MAX_FILE_BYTES,
            description: `바이트 크기 (최대 ${MAX_FILE_BYTES})`,
          },
          sha256: {
            type: "string",
            description: "클라이언트 추정값(참고용). 정본은 finalize 시 서버가 계산한다.",
          },
        },
      },
      Region: {
        type: "object",
        properties: {
          sido: { type: "string" },
          sigungu: { type: "string" },
          eup_myeon_dong: { type: "string" },
        },
      },
      SubmissionInput: {
        type: "object",
        required: ["election", "title", "turnstile_token"],
        description:
          "근거가 없으면 등록 불가: sources(URL·텍스트) 또는 attachments(직접 업로드) 중 최소 하나는 비어있지 않아야 한다.",
        properties: {
          election: { type: "string", description: "선거명 (필수)" },
          title: { type: "string", description: "제보 제목 (필수)" },
          summary: { type: "string" },
          body: { type: "string" },
          region: { $ref: "#/components/schemas/Region" },
          occurred_at: { type: "string", format: "date-time" },
          tags: { type: "array", items: { type: "string" } },
          sources: {
            type: "array",
            description: "출처 목록(웹사이트 URL 또는 직접 입력 텍스트). attachments 가 있으면 비어도 된다.",
            items: { $ref: "#/components/schemas/Source" },
          },
          attachments: {
            type: "array",
            maxItems: MAX_ATTACHMENTS,
            description: `첨부 (최대 ${MAX_ATTACHMENTS}개)`,
            items: { $ref: "#/components/schemas/Attachment" },
          },
          exif: {
            type: "array",
            items: {},
            description: "클라이언트가 추출한 EXIF 요약. 원본 이미지는 서버를 경유하지 않는다.",
          },
          consent: {
            type: "boolean",
            description: "익명 제보·공개 동의 여부. 실명·연락처는 저장하지 않는다.",
          },
          turnstile_token: { type: "string", description: "Cloudflare Turnstile 토큰 (필수)" },
        },
      },
      SubmissionCreated: {
        type: "object",
        required: ["submission_id", "finalize_token", "uploads"],
        properties: {
          submission_id: { type: "string" },
          finalize_token: { type: "string", description: "finalize 호출 시 필요" },
          uploads: {
            type: "array",
            description: "첨부별 presigned PUT 대상. 클라가 put_url 로 R2 에 직접 업로드한다.",
            items: {
              type: "object",
              required: ["staging_key", "put_url"],
              properties: {
                staging_key: { type: "string" },
                put_url: { type: "string", format: "uri" },
              },
            },
          },
        },
      },
      FinalizeInput: {
        type: "object",
        required: ["finalize_token"],
        properties: {
          finalize_token: { type: "string", description: "POST /submissions 응답의 finalize_token" },
        },
      },
      SubmissionFinalized: {
        type: "object",
        required: ["submission_id", "issue_url", "attachments"],
        properties: {
          submission_id: { type: "string" },
          issue_url: { type: "string", format: "uri", description: "생성된 GitHub Issue URL" },
          attachments: {
            type: "array",
            items: {
              type: "object",
              required: ["filename", "r2_key", "sha256", "mime", "size"],
              properties: {
                filename: { type: "string" },
                r2_key: { type: "string", description: "정식 R2 key" },
                sha256: { type: "string", description: "서버가 계산한 정본 해시" },
                mime: { type: "string", description: "magic bytes 로 판별한 실제 타입" },
                size: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
} as const;

/** Scalar API Reference standalone HTML. spec 은 /openapi.json 에서 로드한다. */
export const referenceHtml = `<!doctype html>
<html>
  <head>
    <title>Votatis 제보 수집 API</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <script id="api-reference" data-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
