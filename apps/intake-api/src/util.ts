/** JSON 응답 헬퍼. 추가 헤더(CORS 등)를 병합한다. */
export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

export function errorJson(message: string, status: number, headers: Record<string, string> = {}): Response {
  return json({ error: message }, status, headers);
}

export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const view = data instanceof Uint8Array ? data : new Uint8Array(data);
  const digest = await crypto.subtle.digest("SHA-256", view);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 요청 특성에서 파생한 익명 제보자 ID. 실명/연락처는 절대 저장하지 않는다. */
export async function anonSubmitterId(ip: string | null, userAgent: string | null): Promise<string> {
  const seed = `${ip ?? "noip"}|${userAgent ?? "noua"}`;
  const hash = await sha256Hex(new TextEncoder().encode(seed));
  return `anon-${hash.slice(0, 8)}`;
}

export function randomId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export function clientIp(request: Request): string | null {
  return request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For");
}

/** 경로 조작/위험 문자를 제거한 안전한 파일명. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 128) || "file";
}
