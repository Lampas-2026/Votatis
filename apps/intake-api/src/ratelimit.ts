import type { Env } from "./types";

// KV 기반 고정 윈도우 rate limit (IP 기준). Cloudflare Rate Limiting 규칙과 동일한
// "IP당 N요청/윈도우" 의도를 Workers 내부에서 구현한다. KV는 결과적 일관성이라
// 정밀 카운팅은 아니지만 MVP 남용 방지에는 충분하다.
const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 10;

export async function checkRateLimit(env: Env, ip: string | null): Promise<boolean> {
  const id = ip ?? "noip";
  const key = `rl:${id}`;
  const current = await env.PENDING_KV.get(key);
  const count = current ? parseInt(current, 10) : 0;
  if (count >= MAX_REQUESTS) return false;
  await env.PENDING_KV.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS });
  return true;
}
