---
tldr: apps/frontend(SSG)를 Cloudflare Pages(votatis-web)에 배포할 땐 ①NEXT_PUBLIC_*(API URL·Turnstile sitekey)를 빌드 타임에 주입해 빌드 ②`wrangler pages deploy out --project-name=votatis-web --branch=main`(브랜치 생략 시 현재 git 브랜치 기반 preview로 올라가 votatis-web.pages.dev가 아님) ③preview origin은 intake ALLOWED_ORIGIN에 없어 CORS 막힘(production 도메인만 허용) ④실 Turnstile sitekey domains에 votatis-web.pages.dev를 대시보드에서 추가해야 제보 폼 동작.
tags: [pitfall, deploy, cloudflare-pages, frontend, cors]
last_retrieved: 2026-06-11
retrieval_count: 1
---

## 규칙 / 교훈
`apps/frontend`(Next SSG) → Cloudflare Pages 배포 절차와 함정:

1. **env는 빌드 타임에 박힌다**: SSG라 `NEXT_PUBLIC_*`가 빌드 시 번들에 고정된다. 운영 배포 전 반드시 운영값으로 빌드:
   ```bash
   NEXT_PUBLIC_API_BASE_URL="https://votatis-intake-api.3dulev.workers.dev" \
   NEXT_PUBLIC_TURNSTILE_SITEKEY="0x4AAAAAADhXh1OGOie5kiwQ" \
   pnpm --filter votatis-frontend build
   ```
   기본값(`localhost:8787`)으로 빌드해 올리면 배포 사이트가 localhost를 호출한다.
2. **`--branch=main`으로 production 배포**: `wrangler pages deploy out --project-name=votatis-web` 만 쓰면 **현재 git 브랜치명**(예: feat/...)이 deployment 브랜치가 돼 **preview**(`<branch>.votatis-web.pages.dev`)로 올라간다. production 도메인 `votatis-web.pages.dev`에 반영하려면 `--branch=main` 필요. (dirty 워크트리면 `--commit-dirty=true`)
3. **preview origin은 CORS 막힘**: intake-api `ALLOWED_ORIGIN`엔 production `https://votatis-web.pages.dev`만 있다. preview URL(`<hash>.votatis-web.pages.dev`)에서 제출하면 CORS 차단 → "API 200인데 브라우저 실패". preview에서 테스트하려면 그 origin을 ALLOWED_ORIGIN에 추가해야 한다.
4. **Turnstile 도메인**: 실 위젯 sitekey의 허용 domains에 `votatis-web.pages.dev`가 없으면(기본 localhost) 위젯이 토큰을 못 줘 제출이 막힌다. Cloudflare Turnstile 대시보드에서 도메인 추가(CLI 불가).

## 왜
- 빌드 타임 env·브랜치 기반 preview·CORS origin·Turnstile domain — 넷 중 하나만 어긋나도 "사이트는 뜨는데 제보가 안 됨"으로 나타나 원인 추적이 헷갈린다. 한 번 겪었으니 절차로 고정한다.

## 적용
- CF 인증: `set -a; . ./.env; set +a; export CLOUDFLARE_API_TOKEN=$CF_API_TOKEN CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID`.
- intake-api도 함께 배포해야 하면 `pnpm --filter votatis-intake-api run deploy`(D1 바인딩·원격 마이그레이션 선행). 관련: [[intake-api-local-flow-test]], [[web-dev-port-cors]].
