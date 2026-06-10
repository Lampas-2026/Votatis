import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
  fetchMock,
} from "cloudflare:test";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import worker from "../src/index";
import { detectImageType } from "../src/validation";
import { sha256Hex } from "../src/util";
import { cleanupPending } from "../src/cleanup";

const ORIGIN = "https://app.test";
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);

function post(path: string, body: unknown, opts: { origin?: string; ip?: string } = {}) {
  return new Request(`https://api.test${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: opts.origin ?? ORIGIN,
      "CF-Connecting-IP": opts.ip ?? "1.2.3.4",
      "User-Agent": "test-agent",
    },
    body: JSON.stringify(body),
  });
}

function get(path: string): Request {
  return new Request(`https://api.test${path}`, { method: "GET" });
}

function put(url: string, bytes: Uint8Array): Request {
  return new Request(url, { method: "PUT", headers: { origin: ORIGIN }, body: bytes });
}

async function call(request: Request): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await worker.fetch!(request, env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

function mockTurnstile(success: boolean, times = 1) {
  fetchMock
    .get("https://challenges.cloudflare.com")
    .intercept({ path: "/turnstile/v0/siteverify", method: "POST" })
    .reply(200, { success })
    .times(times);
}

const validBody = () => ({
  election: "제8회 전국동시지방선거",
  title: "테스트 제보",
  summary: "요약",
  body: "본문",
  sources: [{ url: "https://example.com/report" }],
  attachments: [{ filename: "evidence.jpg", mime: "image/jpeg", size: JPEG.byteLength }],
  turnstile_token: "tok",
});

type Started = {
  submission_id: string;
  finalize_token: string;
  uploads: { staging_key: string; put_url: string }[];
};

async function startSubmission(ip: string, body: unknown = validBody()): Promise<Started> {
  mockTurnstile(true);
  const res = await call(post("/submissions", body, { ip }));
  expect(res.status).toBe(200);
  return (await res.json()) as Started;
}

/** id 로 DB 원본 행 1건 조회(내부 필드 확인용). */
async function dbRow(id: string): Promise<Record<string, unknown> | null> {
  return env.DB.prepare("SELECT * FROM reports WHERE id = ?").bind(id).first();
}

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

describe("POST /submissions", () => {
  it("허용되지 않은 오리진은 403 (CORS, ACAO 없음)", async () => {
    const res = await call(post("/submissions", validBody(), { origin: "https://evil.test" }));
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("Turnstile 실패면 403", async () => {
    mockTurnstile(false);
    const res = await call(post("/submissions", validBody(), { ip: "10.0.0.1" }));
    expect(res.status).toBe(403);
  });

  it("출처도 첨부도 없으면 400 (근거 없으면 등록 불가)", async () => {
    const body = { ...validBody(), sources: [], attachments: [] };
    const res = await call(post("/submissions", body, { ip: "10.0.0.2" }));
    expect(res.status).toBe(400);
  });

  it("source 에 url·text 가 둘 다 없으면 400", async () => {
    const body = { ...validBody(), sources: [{ type: "submitter" }] };
    const res = await call(post("/submissions", body, { ip: "10.0.0.21" }));
    expect(res.status).toBe(400);
  });

  it("허용 외 첨부 MIME 은 400", async () => {
    const body = { ...validBody(), attachments: [{ filename: "x.svg", mime: "image/svg+xml", size: 10 }] };
    const res = await call(post("/submissions", body, { ip: "10.0.0.24" }));
    expect(res.status).toBe(400);
  });

  it("텍스트 출처만 있고 첨부가 없어도 200 (직접 입력 출처)", async () => {
    mockTurnstile(true);
    const body = { ...validBody(), sources: [{ text: "현장에서 직접 목격" }], attachments: [] };
    const res = await call(post("/submissions", body, { ip: "10.0.0.22" }));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { uploads: unknown[] };
    expect(data.uploads).toHaveLength(0);
  });

  it("정상 제출은 200 + presigned URL + D1 pending 레코드", async () => {
    const s = await startSubmission("10.0.0.3");
    expect(s.submission_id).toBeTruthy();
    expect(s.uploads).toHaveLength(1);
    expect(s.uploads[0].staging_key).toMatch(/^_staging\//);
    expect(s.uploads[0].put_url).toContain("X-Amz-Signature");

    const row = await dbRow(s.submission_id);
    expect(row).not.toBeNull();
    expect(row!.status).toBe("pending");
    expect(row!.finalize_token).toBe(s.finalize_token);
  });

  it("동일 IP 과다 요청은 429 (rate limit)", async () => {
    mockTurnstile(true, 12);
    const ip = "10.9.9.9";
    let last = 0;
    for (let n = 0; n < 11; n++) {
      const res = await call(post("/submissions", validBody(), { ip }));
      last = res.status;
    }
    expect(last).toBe(429);
  });
});

describe("POST /submissions/:id/finalize", () => {
  it("magic bytes 불일치 파일은 400 으로 거부", async () => {
    const s = await startSubmission("10.1.0.1");
    await env.EVIDENCE_BUCKET.put(s.uploads[0].staging_key, new TextEncoder().encode("hello not image"));
    const res = await call(
      post(`/submissions/${s.submission_id}/finalize`, { finalize_token: s.finalize_token }, { ip: "10.1.0.1" }),
    );
    expect(res.status).toBe(400);
  });

  it("정상 finalize: status=unverified + 정식 key 이동 + 서버 SHA-256 + staging/토큰 비움, issue_url 없음", async () => {
    const s = await startSubmission("10.1.0.2");
    await env.EVIDENCE_BUCKET.put(s.uploads[0].staging_key, JPEG);

    const res = await call(
      post(`/submissions/${s.submission_id}/finalize`, { finalize_token: s.finalize_token }, { ip: "10.1.0.2" }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      report_id: string;
      attachments: { r2_key: string; sha256: string }[];
      issue_url?: string;
    };
    expect(data.report_id).toBe(s.submission_id);
    expect(data.issue_url).toBeUndefined();

    // 서버 계산 SHA-256 이 정본
    expect(data.attachments[0].sha256).toBe(await sha256Hex(JPEG));

    // 정식 key 로 이동
    const finalKey = data.attachments[0].r2_key;
    expect(finalKey).toMatch(/^제8회/);
    expect(await env.EVIDENCE_BUCKET.get(finalKey)).not.toBeNull();
    // staging 삭제
    expect(await env.EVIDENCE_BUCKET.get(s.uploads[0].staging_key)).toBeNull();

    // D1: status 전이 + 내부필드 비움
    const row = await dbRow(s.submission_id);
    expect(row!.status).toBe("unverified");
    expect(row!.finalize_token).toBeNull();
    expect(row!.staging).toBeNull();
  });

  it("토큰 불일치는 403", async () => {
    const s = await startSubmission("10.1.0.3");
    await env.EVIDENCE_BUCKET.put(s.uploads[0].staging_key, JPEG);
    const res = await call(
      post(`/submissions/${s.submission_id}/finalize`, { finalize_token: "wrong" }, { ip: "10.1.0.3" }),
    );
    expect(res.status).toBe(403);
  });

  it("존재하지 않는 제출은 404", async () => {
    const res = await call(
      post(`/submissions/nonexistent/finalize`, { finalize_token: "x" }, { ip: "10.1.0.4" }),
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /reports (정식 조회)", () => {
  const ELECTION = "조회테스트선거-A";

  async function seedConfirmed(ip: string) {
    const body = { ...validBody(), election: ELECTION, tags: ["개표소", "투표지"] };
    const s = await startSubmission(ip, body);
    await env.EVIDENCE_BUCKET.put(s.uploads[0].staging_key, JPEG);
    const fin = await call(
      post(`/submissions/${s.submission_id}/finalize`, { finalize_token: s.finalize_token }, { ip }),
    );
    expect(fin.status).toBe(200);
    return s.submission_id;
  }

  it("finalize 된 레코드가 목록에 나오고 pending 은 제외된다", async () => {
    const confirmedId = await seedConfirmed("10.3.0.1");
    // pending(미완료) 레코드 하나 생성 — 목록에 나오면 안 됨
    const pending = await startSubmission("10.3.0.2", { ...validBody(), election: ELECTION });

    const res = await call(get(`/reports?election=${encodeURIComponent(ELECTION)}`));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      items: { id: string; status: string; attachment_count: number }[];
      total: number;
    };
    const ids = data.items.map((i) => i.id);
    expect(ids).toContain(confirmedId);
    expect(ids).not.toContain(pending.submission_id);
    expect(data.items.every((i) => i.status !== "pending")).toBe(true);
  });

  it("tag 필터가 동작한다", async () => {
    await seedConfirmed("10.3.0.3");
    const res = await call(get(`/reports?election=${encodeURIComponent(ELECTION)}&tag=개표소`));
    const data = (await res.json()) as { items: unknown[]; total: number };
    expect(data.total).toBeGreaterThan(0);

    const none = await call(get(`/reports?election=${encodeURIComponent(ELECTION)}&tag=없는태그zzz`));
    const noneData = (await none.json()) as { total: number };
    expect(noneData.total).toBe(0);
  });

  it("GET /reports/{id} 상세 + submitter/내부필드 비노출", async () => {
    const id = await seedConfirmed("10.3.0.4");
    const res = await call(get(`/reports/${id}`));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain("submitter");
    expect(text).not.toContain("finalize_token");
    expect(text).not.toContain("staging");
    const data = JSON.parse(text) as { id: string; status: string; verification: unknown };
    expect(data.id).toBe(id);
    expect(data.status).toBe("unverified");
    expect(data.verification).toBeTruthy();
  });

  it("pending/없는 id 는 404", async () => {
    const pending = await startSubmission("10.3.0.5", { ...validBody(), election: ELECTION });
    expect((await call(get(`/reports/${pending.submission_id}`))).status).toBe(404);
    expect((await call(get(`/reports/does-not-exist`))).status).toBe(404);
  });
});

describe("pending 정리 (cleanupPending)", () => {
  it("TTL 지난 pending 레코드를 삭제한다", async () => {
    const s = await startSubmission("10.4.0.1", { ...validBody(), election: "정리테스트" });
    expect(await dbRow(s.submission_id)).not.toBeNull();

    // 미래 시점(2시간 뒤) 기준으로 정리 → createdAt 이 TTL(1h) 보다 오래됨
    await cleanupPending(env, Date.now() + 2 * 60 * 60 * 1000);
    expect(await dbRow(s.submission_id)).toBeNull();
  });
});

describe("로컬 업로드 shim (LOCAL_UPLOAD)", () => {
  beforeAll(() => {
    env.LOCAL_UPLOAD = "true";
  });
  afterAll(() => {
    env.LOCAL_UPLOAD = undefined;
  });

  it("put_url 이 /_dev/upload 를 가리키고, PUT→finalize 전 흐름이 R2 자격증명 없이 돈다", async () => {
    const s = await startSubmission("10.5.0.1");
    expect(s.uploads[0].put_url).toContain("/_dev/upload/");

    // 워커 자체 업로드 경로로 PUT(로컬 R2 적재)
    const up = await call(put(s.uploads[0].put_url, JPEG));
    expect(up.status).toBe(200);

    const fin = await call(
      post(`/submissions/${s.submission_id}/finalize`, { finalize_token: s.finalize_token }, { ip: "10.5.0.1" }),
    );
    expect(fin.status).toBe(200);
    const data = (await fin.json()) as { attachments: { sha256: string }[] };
    expect(data.attachments[0].sha256).toBe(await sha256Hex(JPEG));
  });
});

describe("문서 / 유닛", () => {
  it("LOCAL_UPLOAD off(기본)면 PUT /_dev/upload 는 404", async () => {
    const res = await call(put("https://api.test/_dev/upload/_staging/x/y.jpg", JPEG));
    expect(res.status).toBe(404);
  });

  it("detectImageType 이 JPEG 매직바이트를 인식", () => {
    expect(detectImageType(JPEG)).toBe("image/jpeg");
    expect(detectImageType(new TextEncoder().encode("not image"))).toBeNull();
  });

  it("GET /openapi.json 이 라우트를 담은 OpenAPI 3.1 스펙을 반환", async () => {
    const res = await call(get("/openapi.json"));
    expect(res.status).toBe(200);
    const spec = (await res.json()) as { openapi: string; paths: Record<string, unknown> };
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.paths["/submissions"]).toBeTruthy();
    expect(spec.paths["/reports"]).toBeTruthy();
  });

  it("GET /reference 가 Scalar HTML 을 반환", async () => {
    const res = await call(get("/reference"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toContain("@scalar/api-reference");
  });

  it("GET /health → ok", async () => {
    const res = await call(get("/health"));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });
});
