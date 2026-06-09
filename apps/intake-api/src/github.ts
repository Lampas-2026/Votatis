import type { Env, PendingSubmission } from "./types";
import { getInstallationToken } from "./github-app";

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
  for (const s of i.sources) {
    lines.push(`  - url: "${yamlEscape(s.url)}"`);
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

/** GitHub Issue 를 생성하고 html_url 을 반환한다. GitHub App installation 토큰(봇)으로 인증한다. */
export async function createIssue(
  env: Env,
  title: string,
  body: string,
  labels: string[] = ["unverified"],
): Promise<string> {
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
