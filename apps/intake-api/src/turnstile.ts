const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Cloudflare Turnstile 토큰을 서버에서 검증한다. presigned 발급 전에 반드시 통과해야 한다. */
export async function verifyTurnstile(
  secret: string,
  token: string | undefined,
  ip: string | null,
): Promise<boolean> {
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);

  const resp = await fetch(SITEVERIFY, { method: "POST", body: form });
  if (!resp.ok) return false;
  const data = (await resp.json()) as { success?: boolean };
  return data.success === true;
}
