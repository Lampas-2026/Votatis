/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** intake-api 엔드포인트 (로컬: http://localhost:8787, 운영: workers.dev) */
  readonly PUBLIC_API_BASE_URL?: string;
  /** Cloudflare Turnstile sitekey (기본: Cloudflare 테스트키 — 항상 통과) */
  readonly PUBLIC_TURNSTILE_SITEKEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
