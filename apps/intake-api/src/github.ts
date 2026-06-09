import type { Env, PendingSubmission } from "./types";
import { getInstallationToken } from "./github-app";
import { json } from "./util";

export interface FinalizedAttachment {
  filename: string;
  r2_key: string;
  sha256: string;
  mime: string;
  size: number;
}

function yamlEscape(v: string): string {
  return v.replace(/"/g, '\\"');
}

/**
 * PRD §7 스키마에 맞춘 YAML frontmatter + 마크다운 본문의 Issue 본문을 만든다.
 * status 는 항상 unverified — Worker 는 판단하지 않는다(검증은 사람 큐에서).
 */
export function buildIssueBody(p: PendingSubmission, attachments: FinalizedAttachment[]): string {
  const i = p.input;
  const lines: string[] = [];
  lines.push("---");
  lines.push(`submission_id: "${yamlEscape(p.submission_id)}"`);
  lines.push(`election: "${yamlEscape(i.election)}"`);
  lines.push(`title: "${yamlEscape(i.title)}"`);
  if (i.summary) lines.push(`summary: "${yamlEscape(i.summary)}"`);
  lines.push(`status: "unverified"`);
  lines.push(`tags: [${(i.tags ?? []).map((t) => `"${yamlEscape(t)}"`).join(", ")}]`);
  if (i.counting_unit) lines.push(`counting_unit: "${yamlEscape(i.counting_unit)}"`);
  lines.push("region:");
  lines.push(`  sido: ${i.region?.sido ? `"${yamlEscape(i.region.sido)}"` : "null"}`);
  lines.push(`  sigungu: ${i.region?.sigungu ? `"${yamlEscape(i.region.sigungu)}"` : "null"}`);
  lines.push(
    `  eup_myeon_dong: ${i.region?.eup_myeon_dong ? `"${yamlEscape(i.region.eup_myeon_dong)}"` : "null"}`,
  );
  if (i.occurred_at) lines.push(`occurred_at: "${yamlEscape(i.occurred_at)}"`);
  lines.push(`collected_at: "${p.collected_at}"`);
  lines.push("sources:");
  for (const s of i.sources ?? []) {
    // url(웹사이트) 또는 text(직접 입력) 중 있는 것을 기록. 둘 다 있으면 둘 다.
    if (s.url) lines.push(`  - url: "${yamlEscape(s.url)}"`);
    else lines.push(`  - text: "${yamlEscape(s.text ?? "")}"`);
    if (s.url && s.text) lines.push(`    text: "${yamlEscape(s.text)}"`);
    lines.push(`    type: "${yamlEscape(s.type ?? "submitter")}"`);
    if (s.captured_at) lines.push(`    captured_at: "${yamlEscape(s.captured_at)}"`);
    if (s.archive_url) lines.push(`    archive_url: "${yamlEscape(s.archive_url)}"`);
  }
  lines.push("attachments:");
  for (const a of attachments) {
    lines.push(`  - filename: "${yamlEscape(a.filename)}"`);
    lines.push(`    r2_key: "${yamlEscape(a.r2_key)}"`);
    lines.push(`    sha256: "${a.sha256}"`);
    lines.push(`    mime: "${a.mime}"`);
    lines.push(`    size: ${a.size}`);
  }
  lines.push(`submitter: "${p.submitter}"`);
  lines.push(`license: "CC-BY-4.0"`);
  lines.push("---");
  lines.push("");
  lines.push(i.body ?? "");
  return lines.join("\n");
}

/** SIMULATE_GITHUB 플래그(.dev.vars 전용)가 켜졌는지. 켜지면 실제 GitHub 호출을 시뮬레이션한다. */
export function isSimulateGithub(env: Env): boolean {
  return env.SIMULATE_GITHUB === "true" || env.SIMULATE_GITHUB === "1";
}

// 시뮬레이션된 가짜 Issue 는 PENDING_KV 에 저장한다. (dev 전용, 무기한)
const SIM_ISSUE_PREFIX = "sim-issue:";
const SIM_SEQ_KEY = "sim-issue-seq";

interface SimIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
  created_at: string;
}

/**
 * GitHub Issue 생성을 시뮬레이션한다. api.github.com 을 호출하지 않고 KV 에 가짜 Issue 를 적재,
 * issue_url 은 Worker 가 제공하는 /simulate/issues/{n} 가상 경로를 가리킨다.
 * 채번은 best-effort(KV 는 원자적 increment 가 없음) — dev 저부하라 충분.
 */
async function simulateCreateIssue(
  env: Env,
  title: string,
  body: string,
  labels: string[],
  baseUrl: string,
): Promise<string> {
  const prev = parseInt((await env.PENDING_KV.get(SIM_SEQ_KEY)) ?? "0", 10);
  const number = (Number.isFinite(prev) ? prev : 0) + 1;
  await env.PENDING_KV.put(SIM_SEQ_KEY, String(number));

  const issue: SimIssue = { number, title, body, labels, created_at: new Date().toISOString() };
  await env.PENDING_KV.put(`${SIM_ISSUE_PREFIX}${number}`, JSON.stringify(issue));

  return `${baseUrl}/simulate/issues/${number}`;
}

/** GET /simulate/issues[/{n}] — 시뮬레이션 모드에서만 라우팅된다(index.ts 가 게이팅). */
export async function handleSimIssuesRequest(env: Env, url: URL): Promise<Response> {
  const rest = url.pathname.slice("/simulate/issues".length); // "" | "/" | "/{n}"

  if (rest === "" || rest === "/") {
    const listed = await env.PENDING_KV.list({ prefix: SIM_ISSUE_PREFIX });
    const issues: Array<Omit<SimIssue, "body"> & { url: string }> = [];
    for (const k of listed.keys) {
      const raw = await env.PENDING_KV.get(k.name);
      if (!raw) continue;
      const r = JSON.parse(raw) as SimIssue;
      issues.push({
        number: r.number,
        title: r.title,
        labels: r.labels,
        created_at: r.created_at,
        url: `${url.origin}/simulate/issues/${r.number}`,
      });
    }
    issues.sort((a, b) => a.number - b.number);
    return json({ issues }, 200);
  }

  const m = /^\/(\d+)$/.exec(rest);
  if (m) {
    const raw = await env.PENDING_KV.get(`${SIM_ISSUE_PREFIX}${m[1]}`);
    if (!raw) return new Response("Not Found", { status: 404 });
    const issue = JSON.parse(raw) as SimIssue;
    return new Response(issue.body, {
      status: 200,
      headers: { "content-type": "text/markdown; charset=utf-8" },
    });
  }

  return new Response("Not Found", { status: 404 });
}

/** GitHub Issue 를 생성하고 html_url 을 반환한다. GitHub App installation 토큰(봇)으로 인증한다. */
export async function createIssue(
  env: Env,
  title: string,
  body: string,
  labels: string[] = ["unverified"],
  baseUrl = "",
): Promise<string> {
  if (isSimulateGithub(env)) return simulateCreateIssue(env, title, body, labels, baseUrl);

  const token = await getInstallationToken(env);
  const resp = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "votatis-intake-api",
      accept: "application/vnd.github+json",
    },
    body: JSON.stringify({ title, body, labels }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub Issue 생성 실패: ${resp.status} ${text}`);
  }
  const data = (await resp.json()) as { html_url: string };
  return data.html_url;
}
