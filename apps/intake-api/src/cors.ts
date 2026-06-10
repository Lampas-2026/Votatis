import type { Env } from "./types";

/** ALLOWED_ORIGIN 은 쉼표로 구분된 다중 오리진을 허용한다(로컬 dev + 배포 도메인 등). */
export function isOriginAllowed(env: Env, origin: string | null): boolean {
  if (origin === null) return false;
  const allowed = env.ALLOWED_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
  return allowed.includes(origin);
}
