---
tldr: intake-api 로컬 실행은 두 모드 — pnpm dev:local(LOCAL_UPLOAD shim, CF 없이 첨부까지) vs dev:remote(실 R2·D1). TURNSTILE은 항상통과 테스트키(1x0000…AA), D1은 db:migrate:local 선적용. 함정: wrangler dev는 .dev.vars/바인딩 변경 핫리로드 안 함 → 재시작 필수.
tags: [pitfall, testing, cloudflare, intake-api, d1]
last_retrieved: 2026-06-10
retrieval_count: 9
---

## 규칙 / 교훈
`apps/intake-api`(spec 0006: D1 기반, Hono+OpenAPI+Zod)의 제출→finalize→조회 흐름을 로컬 `wrangler dev`로 라이브 확인할 때:

1. **Turnstile**: `.dev.vars`의 `TURNSTILE_SECRET`을 항상통과 테스트키 `1x0000000000000000000000000000000AA`로 두면 어떤 `turnstile_token`(예: `"dummy"`)이든 통과. 운영 secret이 들어있으면 더미는 403.
2. **첨부 없이 텍스트 출처만으로 제출**한다(예: `sources:[{"text":"..."}]`, attachments 생략) → presigned R2 PUT 단계를 통째로 건너뛴다. finalize 응답은 `{ report_id, attachments }`(GitHub Issue·`issue_url` 없음 — 0006에서 제거).
3. **D1 스키마 선적용**: 로컬 D1은 빈 DB라 `pnpm db:migrate:local`을 먼저 돌려야 `reports`/`rate_limits` 테이블이 생긴다. 안 하면 쿼리가 throw → Hono 기본 "Internal Server Error" 500.
4. 적재 확인: `GET http://localhost:8787/reports`(목록, pending 제외) / `GET /reports/{id}`.

## 왜
- **`.dev.vars` 핫리로드 안 됨**: `wrangler dev`(v3)는 `.dev.vars` 값을 바꿔도 자동 반영하지 않는다. 값 수정 후 그대로 요청하면 옛 값으로 동작(예: TURNSTILE_SECRET 바꿨는데 계속 403). 반드시 dev 서버를 **재시작**한다. 마찬가지로 `wrangler.jsonc`의 바인딩 변경(KV→D1 등)도 재시작해야 새 바인딩을 잡는다(안 그러면 `env.DB` undefined → 500).
- **로컬 R2 분리**: 비-`--remote` `wrangler dev`에서 R2는 miniflare 시뮬레이션이지만 presignPut이 만드는 PUT URL은 **실제 R2 엔드포인트**를 가리킨다. 그 URL로 PUT해도 로컬 R2엔 객체가 안 생겨 finalize의 `EVIDENCE_BUCKET.get(staging_key)`가 비어 "업로드되지 않은 첨부" 400. 첨부를 빼면 staging 루프 0회라 R2 단계를 건너뛴다.

## 적용
- **첨부 포함 흐름을 CF 접근 없이 로컬에서**: `pnpm dev:local`(=`wrangler dev --var LOCAL_UPLOAD:true`). presigned 대신 워커 자체 경로 `PUT /_dev/upload/*`가 로컬 R2에 받아 finalize가 같은 로컬 R2를 읽는다. R2 자격증명 불필요. 이 shim은 `LOCAL_UPLOAD` 꺼지면 404(운영 미노출). 클라가 보내는 `put_url`이 `…/_dev/upload/…`면 로컬 모드.
- **실제 R2·원격 D1까지 봐야 하면** `pnpm dev:remote`(=`wrangler dev --remote`). 단 운영 D1·R2를 직접 쓴다(데이터 격리 주의). `--remote`는 R2 `preview_bucket_name`·원격 D1(`database_id` + `db:migrate:remote`) 필요.
- vitest 통합테스트에선 `env.EVIDENCE_BUCKET.put(staging_key, bytes)`로 staging을 직접 채운다(`test/api.test.ts`).
- 증상이 "PUT은 실 R2 `_staging/`에 올라갔는데 finalize가 400"이면 로컬-R2 분리다 → `dev:local`(오프라인) 또는 `dev:remote`(실 R2)로 해결. 가이드: `docs/intake-api.md §5`.
- 출처 규칙: source는 `url` 또는 `text` 중 하나면 유효. 그래서 텍스트 출처 단독 제출이 가능.
- D1 마이그레이션/스키마 함정은 [[drizzle-d1-schema-gotchas]], 테스트 D1 주입은 [[cloudflare-vitest-pool-workers-setup]].
