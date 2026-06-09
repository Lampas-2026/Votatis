import type { Env } from "./types";

export function isOriginAllowed(env: Env, origin: string | null): boolean {
  return origin !== null && origin === env.ALLOWED_ORIGIN;
}

/** 허용된 오리진일 때만 ACAO 헤더를 반환한다. 그 외엔 빈 객체. */
export function corsHeaders(env: Env, origin: string | null): Record<string, string> {
  if (!isOriginAllowed(env, origin)) return { vary: "Origin" };
  return {
    "access-control-allow-origin": origin as string,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

export function preflight(env: Env, request: Request): Response {
  const origin = request.headers.get("Origin");
  return new Response(null, { status: 204, headers: corsHeaders(env, origin) });
}
