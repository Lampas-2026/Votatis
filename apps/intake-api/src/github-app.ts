import type { Env } from "./types";

// GitHub App 인증: App private key 로 RS256 JWT 를 만들고, 그 JWT 로
// repo 의 installation access token 을 발급받는다. Issue 는 이 토큰(봇 정체성)으로 만든다.

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlFromString(s: string): string {
  return b64urlFromBytes(new TextEncoder().encode(s));
}

function pemToDer(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const der = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i);
  return der;
}

// DER TLV 래퍼 (definite length).
function der(tag: number, content: number[]): number[] {
  const len = content.length;
  let lenBytes: number[];
  if (len < 0x80) {
    lenBytes = [len];
  } else {
    const bytes: number[] = [];
    let n = len;
    while (n > 0) {
      bytes.unshift(n & 0xff);
      n >>= 8;
    }
    lenBytes = [0x80 | bytes.length, ...bytes];
  }
  return [tag, ...lenBytes, ...content];
}

// GitHub App 키는 PKCS#1(-----BEGIN RSA PRIVATE KEY-----). WebCrypto 는 PKCS#8 만
// import 가능하므로 PKCS#1 DER 을 PKCS#8 로 감싼다(rsaEncryption AlgorithmIdentifier).
function wrapPkcs1ToPkcs8(pkcs1: Uint8Array): Uint8Array {
  const rsaOid = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const version = [0x02, 0x01, 0x00];
  const privateKeyOctet = der(0x04, [...pkcs1]);
  const seq = der(0x30, [...version, ...rsaOid, ...privateKeyOctet]);
  return new Uint8Array(seq);
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  let derBytes = pemToDer(pem);
  if (pem.includes("BEGIN RSA PRIVATE KEY")) {
    derBytes = wrapPkcs1ToPkcs8(derBytes);
  }
  return crypto.subtle.importKey(
    "pkcs8",
    derBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/** App ID 를 iss 로 하는 짧은 수명(10분) JWT 를 RS256 로 서명한다. */
export async function createAppJWT(appId: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlFromString(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64urlFromString(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const data = `${header}.${payload}`;
  const key = await importPrivateKey(privateKeyPem);
  const sig = await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, key, new TextEncoder().encode(data));
  return `${data}.${b64urlFromBytes(new Uint8Array(sig))}`;
}

function appHeaders(jwt: string): Record<string, string> {
  return {
    authorization: `Bearer ${jwt}`,
    accept: "application/vnd.github+json",
    "user-agent": "votatis-intake-api",
  };
}

/**
 * repo 의 installation 을 찾아 installation access token 을 발급받는다.
 * 토큰은 1시간 만료 — 현재는 매 호출 발급(MVP). 필요 시 KV 캐싱으로 최적화 가능.
 */
export async function getInstallationToken(env: Env): Promise<string> {
  const jwt = await createAppJWT(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);

  const instResp = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/installation`, {
    headers: appHeaders(jwt),
  });
  if (!instResp.ok) {
    throw new Error(`GitHub App installation 조회 실패: ${instResp.status} ${await instResp.text()}`);
  }
  const inst = (await instResp.json()) as { id: number };

  const tokResp = await fetch(`https://api.github.com/app/installations/${inst.id}/access_tokens`, {
    method: "POST",
    headers: appHeaders(jwt),
  });
  if (!tokResp.ok) {
    throw new Error(`GitHub App 토큰 발급 실패: ${tokResp.status} ${await tokResp.text()}`);
  }
  const tok = (await tokResp.json()) as { token: string };
  return tok.token;
}
