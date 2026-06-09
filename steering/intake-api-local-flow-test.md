---
tldr: intake-api를 로컬 wrangler dev로 끝까지 찔러볼 땐 ①--var로 SIMULATE_GITHUB:true·TURNSTILE_SECRET 테스트키 주입(.dev.vars 안 건드림) ②첨부 없이 텍스트 출처만 제출(presigned R2 PUT 단계 회피)로 finalize까지 한 번에 돈다.
tags: [pitfall, testing, cloudflare, intake-api]
last_retrieved: 2026-06-09
retrieval_count: 1
---

## 규칙 / 교훈
`apps/intake-api`의 제출→finalize 전 흐름을 로컬 `wrangler dev`로 라이브 확인할 때:

1. 플래그·secret은 `--var`로 주입해 `.dev.vars`(사용자 실제 값)를 건드리지 않는다.
   `pnpm exec wrangler dev --port 8787 --var SIMULATE_GITHUB:true --var TURNSTILE_SECRET:1x0000000000000000000000000000000AA`
   - `SIMULATE_GITHUB=true` → GitHub App 없이 finalize가 가짜 Issue 생성, `/.simulate/issues[/{n}]`로 확인.
   - 테스트키 `1x0000…AA` → 어떤 turnstile_token이든 통과.
2. **첨부 없이 텍스트 출처만으로 제출**한다(예: `sources:[{"text":"..."}]`, attachments 생략).
   - finalize 응답의 `issue_url`이 `/.simulate/issues/{n}`을 가리키고, 그 경로로 렌더된 Issue 본문을 본다.

## 왜
로컬(비-`--remote`) `wrangler dev`에서 R2는 miniflare 시뮬레이션이지만, presignPut이 만드는 PUT URL은 **실제 R2 엔드포인트**를 가리킨다. 그래서 그 URL로 PUT해도 로컬 R2엔 객체가 안 생기고, finalize의 `EVIDENCE_BUCKET.get(staging_key)`가 비어 "업로드되지 않은 첨부" 400이 난다. 첨부를 빼면 staging 루프가 0회라 R2 단계를 통째로 건너뛴다.

## 적용
- 첨부 포함 흐름까지 봐야 하면 `wrangler dev --remote`(실제 R2)로 PUT하거나, vitest 통합테스트에서 `env.EVIDENCE_BUCKET.put(staging_key, bytes)`로 staging을 직접 채운다(`test/api.test.ts` 참고).
- 출처 규칙: source는 `url` 또는 `text` 중 하나면 유효(0001 changelog). 그래서 텍스트 출처 단독 제출이 가능.
