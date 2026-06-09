import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
  fetchMock,
} from "cloudflare:test";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import worker from "../src/index";
import { buildIssueBody } from "../src/github";
import { createAppJWT } from "../src/github-app";
import { detectImageType } from "../src/validation";
import { sha256Hex } from "../src/util";
import type { PendingSubmission } from "../src/types";

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

async function call(request: Request): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

function get(path: string): Request {
  return new Request(`https://api.test${path}`, { method: "GET" });
}

function mockTurnstile(success: boolean, times = 1) {
  fetchMock
    .get("https://challenges.cloudflare.com")
    .intercept({ path: "/turnstile/v0/siteverify", method: "POST" })
    .reply(200, { success })
    .times(times);
}

function mockGithub() {
  // GitHub App: installation 조회 → installation token → issue 생성
  fetchMock
    .get("https://api.github.com")
    .intercept({ path: "/repos/3dulev/votatis-data/installation", method: "GET" })
    .reply(200, { id: 999 });
  fetchMock
    .get("https://api.github.com")
    .intercept({ path: "/app/installations/999/access_tokens", method: "POST" })
    .reply(201, { token: "ghs_testinstalltoken" });
  fetchMock
    .get("https://api.github.com")
    .intercept({ path: "/repos/3dulev/votatis-data/issues", method: "POST" })
    .reply(201, { html_url: "https://github.com/3dulev/votatis-data/issues/1" });
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

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

describe("POST /submissions", () => {
  it("허용되지 않은 오리진은 403 (CORS)", async () => {
    const res = await call(post("/submissions", validBody(), { origin: "https://evil.test" }));
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("Turnstile 실패면 403", async () => {
    mockTurnstile(false);
    const res = await call(post("/submissions", validBody(), { ip: "10.0.0.1" }));
    expect(res.status).toBe(403);
  });

  it("출처(URL/텍스트)도 첨부도 없으면 400 (근거 없으면 등록 불가)", async () => {
    const body = { ...validBody(), sources: [], attachments: [] };
    const res = await call(post("/submissions", body, { ip: "10.0.0.2" }));
    expect(res.status).toBe(400);
  });

  it("source 에 url·text 가 둘 다 없으면 400", async () => {
    const body = { ...validBody(), sources: [{ type: "submitter" }] };
    const res = await call(post("/submissions", body, { ip: "10.0.0.21" }));
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

  it("첨부만 있고 sources 가 없어도 200 (직접 업로드)", async () => {
    mockTurnstile(true);
    const { sources: _drop, ...rest } = validBody();
    const res = await call(post("/submissions", rest, { ip: "10.0.0.23" }));
    expect(res.status).toBe(200);
  });

  it("정상 제출은 200 + presigned URL + KV pending 기록", async () => {
    mockTurnstile(true);
    const res = await call(post("/submissions", validBody(), { ip: "10.0.0.3" }));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      submission_id: string;
      finalize_token: string;
      uploads: { staging_key: string; put_url: string }[];
    };
    expect(data.submission_id).toBeTruthy();
    expect(data.uploads).toHaveLength(1);
    expect(data.uploads[0].staging_key).toMatch(/^_staging\//);
    expect(data.uploads[0].put_url).toContain("X-Amz-Signature");
    expect(res.headers.get("access-control-allow-origin")).toBe(ORIGIN);

    const stored = await env.PENDING_KV.get(`pending:${data.submission_id}`);
    expect(stored).not.toBeNull();
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
  async function startSubmission(ip: string) {
    mockTurnstile(true);
    const res = await call(post("/submissions", validBody(), { ip }));
    return (await res.json()) as {
      submission_id: string;
      finalize_token: string;
      uploads: { staging_key: string; put_url: string }[];
    };
  }

  it("magic bytes 불일치 파일은 400 으로 거부", async () => {
    const s = await startSubmission("10.1.0.1");
    // staging 에 이미지가 아닌 바이트를 올림
    await env.EVIDENCE_BUCKET.put(s.uploads[0].staging_key, new TextEncoder().encode("hello not image"));
    const res = await call(
      post(`/submissions/${s.submission_id}/finalize`, { finalize_token: s.finalize_token }, { ip: "10.1.0.1" }),
    );
    expect(res.status).toBe(400);
  });

  it("정상 finalize: 정식 key 이동 + 서버 계산 SHA-256 + KV 삭제 + issue_url", async () => {
    const s = await startSubmission("10.1.0.2");
    await env.EVIDENCE_BUCKET.put(s.uploads[0].staging_key, JPEG);
    mockGithub();

    const res = await call(
      post(`/submissions/${s.submission_id}/finalize`, { finalize_token: s.finalize_token }, { ip: "10.1.0.2" }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      issue_url: string;
      attachments: { r2_key: string; sha256: string }[];
    };
    expect(data.issue_url).toContain("github.com");

    // 서버 계산 SHA-256 이 정본
    const expected = await sha256Hex(JPEG);
    expect(data.attachments[0].sha256).toBe(expected);

    // 정식 key 로 이동됨
    const finalKey = data.attachments[0].r2_key;
    expect(finalKey).toMatch(/^제8회/);
    const finalObj = await env.EVIDENCE_BUCKET.get(finalKey);
    expect(finalObj).not.toBeNull();

    // staging 삭제 + KV pending 삭제
    const stagingObj = await env.EVIDENCE_BUCKET.get(s.uploads[0].staging_key);
    expect(stagingObj).toBeNull();
    const kv = await env.PENDING_KV.get(`pending:${s.submission_id}`);
    expect(kv).toBeNull();
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

describe("유닛: 검증/스키마", () => {
  it("detectImageType 이 JPEG 매직바이트를 인식", () => {
    expect(detectImageType(JPEG)).toBe("image/jpeg");
    expect(detectImageType(new TextEncoder().encode("not image"))).toBeNull();
  });

  it("createAppJWT 가 PKCS#1 키로 RS256 JWT 를 서명", async () => {
    const jwt = await createAppJWT(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
    const parts = jwt.split(".");
    expect(parts).toHaveLength(3);
    const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
    expect(header.alg).toBe("RS256");
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    expect(payload.iss).toBe("123456");
    expect(parts[2].length).toBeGreaterThan(100); // 서명 존재
  });

  it("시뮬레이션 off(기본)면 /simulate/issues 는 404", async () => {
    const res = await call(get("/simulate/issues"));
    expect(res.status).toBe(404);
  });

  it("Issue 본문에 익명 submitter + unverified status, 실명 없음", () => {
    const pending: PendingSubmission = {
      submission_id: "abc123",
      finalize_token: "t",
      submitter: "anon-deadbeef",
      collected_at: "2026-06-09T00:00:00.000Z",
      input: {
        election: "제8회 전국동시지방선거",
        title: "제목",
        sources: [{ url: "https://example.com" }],
        consent: true,
      },
      staging: [],
    };
    const body = buildIssueBody(pending, []);
    expect(body).toContain('submitter: "anon-deadbeef"');
    expect(body).toContain('status: "unverified"');
    expect(body).toContain("consent: true");
  });
});

describe("시뮬레이션 모드 (SIMULATE_GITHUB)", () => {
  // 이 describe 동안만 플래그를 켠다. GitHub fetchMock 을 걸지 않으므로,
  // 코드가 api.github.com 을 치면 disableNetConnect 로 실패 → 200 이면 호출 안 했다는 증거.
  beforeAll(() => {
    env.SIMULATE_GITHUB = "true";
  });
  afterAll(() => {
    env.SIMULATE_GITHUB = undefined;
  });

  async function startSubmission(ip: string) {
    mockTurnstile(true);
    const res = await call(post("/submissions", validBody(), { ip }));
    return (await res.json()) as {
      submission_id: string;
      finalize_token: string;
      uploads: { staging_key: string; put_url: string }[];
    };
  }

  it("finalize 가 GitHub API 없이 가짜 issue_url 을 반환", async () => {
    const s = await startSubmission("10.2.0.1");
    await env.EVIDENCE_BUCKET.put(s.uploads[0].staging_key, JPEG);

    const res = await call(
      post(`/submissions/${s.submission_id}/finalize`, { finalize_token: s.finalize_token }, { ip: "10.2.0.1" }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { issue_url: string; attachments: unknown[] };
    expect(data.issue_url).toContain("/simulate/issues/");
    expect(data.attachments).toHaveLength(1);
  });

  it("GET /simulate/issues 목록 + /simulate/issues/{n} 렌더된 본문 조회", async () => {
    const s = await startSubmission("10.2.0.2");
    await env.EVIDENCE_BUCKET.put(s.uploads[0].staging_key, JPEG);
    const fin = await call(
      post(`/submissions/${s.submission_id}/finalize`, { finalize_token: s.finalize_token }, { ip: "10.2.0.2" }),
    );
    const { issue_url } = (await fin.json()) as { issue_url: string };
    const n = issue_url.split("/").pop()!;

    const listRes = await call(get("/simulate/issues"));
    expect(listRes.status).toBe(200);
    const { issues } = (await listRes.json()) as {
      issues: { number: number; title: string; url: string }[];
    };
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => String(i.number) === n)).toBe(true);

    const detRes = await call(get(`/simulate/issues/${n}`));
    expect(detRes.status).toBe(200);
    expect(detRes.headers.get("content-type")).toContain("text/markdown");
    const body = await detRes.text();
    expect(body).toContain('status: "unverified"');

    const missing = await call(get("/simulate/issues/999999"));
    expect(missing.status).toBe(404);
  });
});
