import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { Env } from "./types";
import { isLocalUpload } from "./types";
import { isOriginAllowed } from "./cors";
import { verifyTurnstile } from "./turnstile";
import { checkRateLimit } from "./ratelimit";
import { getDb } from "./db/client";
import { createSubmission } from "./submissions";
import { finalizeSubmission } from "./finalize";
import { listReports, getReport } from "./reports";
import { clientIp } from "./util";
import {
  SubmissionInputSchema,
  SubmissionCreatedSchema,
  FinalizeInputSchema,
  FinalizeResultSchema,
  SubmissionIdParamSchema,
  ReportListQuerySchema,
  ReportListSchema,
  ReportIdParamSchema,
  ReportPublicSchema,
  ErrorSchema,
} from "./schemas";

const app = new OpenAPIHono<{ Bindings: Env }>({
  // Zod 검증 실패를 통일된 { error } 400 으로 변환한다.
  defaultHook: (result, c) => {
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? "유효하지 않은 요청입니다.";
      return c.json({ error: msg }, 400);
    }
  },
});

// ── CORS ─────────────────────────────────────────────────────────────────
// 쓰기(POST)는 허용 오리진만(0001 동작 계승). 읽기(GET)는 공개 API 라 전체 허용.
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") ?? null;
  // 쓰기(POST/PUT)는 허용 오리진만. PUT 은 로컬 업로드 shim(/_dev/upload) 용.
  const isWrite = c.req.method === "POST" || c.req.method === "PUT";

  if (c.req.method === "OPTIONS") {
    const headers: Record<string, string> = { vary: "Origin" };
    if (isOriginAllowed(c.env, origin)) {
      headers["access-control-allow-origin"] = origin as string;
      headers["access-control-allow-methods"] = "GET, POST, PUT, OPTIONS";
      headers["access-control-allow-headers"] = "content-type";
      headers["access-control-max-age"] = "86400";
    }
    return c.body(null, 204, headers);
  }

  if (isWrite && !isOriginAllowed(c.env, origin)) {
    return c.json({ error: "허용되지 않은 오리진입니다." }, 403);
  }

  c.header("vary", "Origin");
  if (isWrite) {
    if (isOriginAllowed(c.env, origin)) c.header("access-control-allow-origin", origin as string);
  } else {
    c.header("access-control-allow-origin", "*");
  }
  await next();
});

app.get("/health", (c) => c.text("ok"));

// ── POST /submissions ──────────────────────────────────────────────────────
const submissionsRoute = createRoute({
  method: "post",
  path: "/submissions",
  request: {
    body: { content: { "application/json": { schema: SubmissionInputSchema } } },
  },
  responses: {
    200: { content: { "application/json": { schema: SubmissionCreatedSchema } }, description: "제출 개시 — presigned 업로드 URL 발급" },
    400: { content: { "application/json": { schema: ErrorSchema } }, description: "유효하지 않은 요청" },
    403: { content: { "application/json": { schema: ErrorSchema } }, description: "Turnstile/오리진 거부" },
    429: { content: { "application/json": { schema: ErrorSchema } }, description: "rate limit" },
  },
});

app.openapi(submissionsRoute, async (c) => {
  const input = c.req.valid("json");
  const ip = clientIp(c.req.raw);

  const human = await verifyTurnstile(c.env.TURNSTILE_SECRET, input.turnstile_token, ip);
  if (!human) return c.json({ error: "Turnstile 검증 실패." }, 403);

  const allowed = await checkRateLimit(getDb(c.env), ip);
  if (!allowed) return c.json({ error: "요청이 너무 많습니다." }, 429);

  const baseUrl = new URL(c.req.url).origin;
  const result = await createSubmission(c.env, input, ip, c.req.header("User-Agent") ?? null, baseUrl);
  return c.json(result, 200);
});

// ── PUT /_dev/upload/* (로컬 업로드 shim, LOCAL_UPLOAD 시에만) ─────────────────
// presigned R2 대신 워커가 직접 로컬 R2(miniflare)에 staging 바이트를 받는다.
// 운영(플래그 off)에선 404 → 노출되지 않는다.
app.put("/_dev/upload/*", async (c) => {
  if (!isLocalUpload(c.env)) return c.text("Not Found", 404);
  const key = c.req.path.slice("/_dev/upload/".length);
  if (!key) return c.json({ error: "업로드 key 가 없습니다." }, 400);
  await c.env.EVIDENCE_BUCKET.put(key, await c.req.arrayBuffer());
  return c.body(null, 200);
});

// ── POST /submissions/{id}/finalize ─────────────────────────────────────────
const finalizeRoute = createRoute({
  method: "post",
  path: "/submissions/{id}/finalize",
  request: {
    params: SubmissionIdParamSchema,
    body: { content: { "application/json": { schema: FinalizeInputSchema } } },
  },
  responses: {
    200: { content: { "application/json": { schema: FinalizeResultSchema } }, description: "확정 — D1 레코드 적재" },
    400: { content: { "application/json": { schema: ErrorSchema } }, description: "검증 실패(업로드 누락/타입/크기)" },
    403: { content: { "application/json": { schema: ErrorSchema } }, description: "토큰 불일치" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "제출 없음/만료" },
  },
});

app.openapi(finalizeRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { finalize_token } = c.req.valid("json");
  const r = await finalizeSubmission(c.env, id, finalize_token);
  if (!r.ok) return c.json({ error: r.error }, r.status);
  return c.json({ report_id: r.report_id, attachments: r.attachments }, 200);
});

// ── GET /reports ─────────────────────────────────────────────────────────────
const reportsListRoute = createRoute({
  method: "get",
  path: "/reports",
  request: { query: ReportListQuerySchema },
  responses: {
    200: { content: { "application/json": { schema: ReportListSchema } }, description: "제보 목록(pending 제외)" },
    400: { content: { "application/json": { schema: ErrorSchema } }, description: "유효하지 않은 쿼리" },
  },
});

app.openapi(reportsListRoute, async (c) => {
  const q = c.req.valid("query");
  const result = await listReports(c.env, q);
  return c.json(result, 200);
});

// ── GET /reports/{id} ────────────────────────────────────────────────────────
const reportGetRoute = createRoute({
  method: "get",
  path: "/reports/{id}",
  request: { params: ReportIdParamSchema },
  responses: {
    200: { content: { "application/json": { schema: ReportPublicSchema } }, description: "제보 상세" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "없음(또는 pending)" },
  },
});

app.openapi(reportGetRoute, async (c) => {
  const { id } = c.req.valid("param");
  const report = await getReport(c.env, id);
  if (!report) return c.json({ error: "제보를 찾을 수 없습니다." }, 404);
  return c.json(report, 200);
});

// ── OpenAPI 문서 + Scalar UI ─────────────────────────────────────────────────
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: { title: "Votatis Intake API", version: "1.0.0" },
});

const REFERENCE_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Votatis Intake API</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script id="api-reference" data-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

app.get("/reference", (c) => c.html(REFERENCE_HTML));
app.get("/docs", (c) => c.html(REFERENCE_HTML));

export default app;
