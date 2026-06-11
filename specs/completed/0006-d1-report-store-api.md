---
id: "0006"
title: D1 기반 제보 저장 + 정식 조회 API (Hono + OpenAPI + Zod)
status: completed   # not-started | in-progress | in-review | completed
created: 2026-06-10
updated: 2026-06-10
related:
  - "specs/completed/0001-report-intake-api.md (대체 대상)"
  - "specs/completed/0002-dev-github-issue-simulation.md (제거 대상)"
  - "docs/MVP-PRD.md §7 데이터 스키마 / §5 데이터 수집 흐름"
  - "https://hono.dev/examples/zod-openapi"
  - "https://orm.drizzle.team/docs/connect-cloudflare-d1"
  - "https://developers.cloudflare.com/d1/best-practices/"
  - "https://developers.cloudflare.com/d1/reference/migrations/"
---

# D1 기반 제보 저장 + 정식 조회 API (Hono + OpenAPI + Zod)

## 1. 배경 / 문제

0001/0002는 검증 큐를 **GitHub Issues**로 두고, finalize가 GitHub App 토큰으로 Issue를 생성했다. 운영해보니 불편이 컸다:

- 이슈 쓰기/편집에 레포 소유·권한 제약이 따라붙고(별도 App 토큰 운영 필요), 잡음·편집 제약·렌더 한계가 많다.
- 조회는 dev 전용 `/simulate/issues`(KV 백업 가짜 Issue)로만 가능해 정식 조회 수단이 없다.
- 라우팅은 손수 만든 `fetch` 분기 + 손으로 유지하는 `openapi.ts`라, 스키마와 문서가 따로 논다.

이를 **D1(SQLite) 기반**으로 전환한다. 확정 제보를 D1 `reports` 테이블에 적재하고, **정식 조회 API**(`GET /reports`)를 제공하며, 서버를 **Hono + @hono/zod-openapi + Zod**로 재구성해 검증·문서를 단일 스키마 소스에서 자동 생성한다. GitHub 연동은 완전히 제거한다.

> 본 스펙은 0001(제보 수집 API)을 **대체**하고 0002(GitHub Issue 시뮬레이션)를 **제거**한다. 2단계 presigned R2 업로드·무결성 해시·익명화·근거 필수 규칙은 0001에서 계승한다.

## 2. 목표 (Goals)

1. finalize가 GitHub Issue 대신 **D1 `reports` 레코드**를 확정 적재한다.
2. 2단계 업로드의 pending(업로드 미완료) 중간상태를 **KV → D1로 통합**한다(KV 바인딩 제거).
3. **정식 조회 API** 제공: `GET /reports`(목록·필터·페이지네이션) + `GET /reports/{id}`(상세). 전부 공개.
4. 서버를 **Hono + @hono/zod-openapi**로 재구성 — Zod 스키마에서 요청 검증 + OpenAPI 문서를 자동 생성하고, 손수 작성한 `openapi.ts`를 제거한다.
5. D1 접근을 **Drizzle ORM + drizzle-kit**으로 — 스키마 단일 소스 + 버전관리된 마이그레이션.
6. GitHub 연동(`github.ts`·`github-app.ts`·`SIMULATE_GITHUB`·Issue 본문 빌더·관련 secrets)을 **완전 제거**한다.

## 3. 비목표 (Non-Goals)

- **검수(status 전이) 기능** — 승인/거절/보완 API·검수 도구·검수자 인증은 별도 스펙(예: 0007). 본 스펙은 저장 + 조회까지.
- 읽기 인증/권한 — 조회는 전부 공개(아래 §4-4 노출 규칙 참고). 쓰기 보호는 기존 Turnstile + Rate Limit 유지.
- 승격 스크립트 / 공개 레포 커밋 / 정적 사이트(별도).
- 벡터/시맨틱 검색(v2).
- 기존 GitHub Issue 데이터의 D1 이관 — 운영 축적 데이터가 없다는 전제(§7 확인 필요).
- 웹앱 UI 변경 — 제출 흐름 계약(요청/응답)은 유지하므로 웹앱은 finalize 응답 형태 변화(아래 §5)만 흡수한다.

## 4. 요구사항

### 기능
1. **제출 개시 `POST /submissions`** — 0001과 동일한 입력(제보 메타 + 첨부목록 + `turnstile_token`). Turnstile 검증 → IP rate limit → 정규화 → 첨부별 presigned PUT URL 발급. pending 레코드를 **D1에 `status='pending'`으로 INSERT**(KV 대신). 응답: `{ submission_id, finalize_token, uploads: [{ staging_key, put_url }] }`.
2. **첨부 직접 업로드** — 0001 그대로(클라가 R2 `_staging/`에 presigned PUT). R2 lifecycle 자동정리 유지.
3. **제출 확정 `POST /submissions/{id}/finalize`** — `finalize_token` 확인 → staging 객체 read → magic bytes·크기 검증 → **서버 SHA-256 계산** → 정식 key로 이동 → D1 레코드를 `status='unverified'`로 UPDATE(첨부 r2_key/sha256 채움, pending 전용 필드 정리). 응답: `{ report_id, attachments }` (기존 `issue_url` 제거).
4. **조회 `GET /reports`** — 확정 레코드 목록. 필터: `election`, `status`, `sido`, `sigungu`, `tags`(포함), 기간(`occurred_at` from/to). 페이지네이션 + 정렬(기본 `collected_at` 내림차순). **pending 내부상태는 노출하지 않는다**(finalize 완료분만). `submitter`(익명 해시)·`finalize_token`·`staging` 등 내부 필드는 응답에서 제외.
5. **조회 `GET /reports/{id}`** — 단건 상세(전체 공개 필드). 없으면 404. pending 레코드는 404 취급.
6. **OpenAPI 문서** — `@hono/zod-openapi`로 `GET /openapi.json`(3.1) 자동생성 + `GET /reference`(Scalar UI) 유지. 라우트·스키마 변경이 문서에 자동 반영(손수 `openapi.ts` 유지보수 제거).
7. **근거 필수 / 익명화 / 정규화** — 0001 계승: 출처(url/text) 또는 첨부 중 최소 하나 필요, `submitter`는 익명 해시(실명·연락처 비저장), PRD §7 스키마로 정규화.

### 비기능
8. **스택**: 런타임 Cloudflare Worker, 프레임워크 Hono(+`@hono/zod-openapi`), DB Cloudflare **D1**, 첨부 R2. ORM **Drizzle** + 마이그레이션 **drizzle-kit / wrangler d1 migrations**. R2 서명은 기존 aws4fetch 유지.
9. **검증 단일 소스**: Zod 스키마로 요청 바디·쿼리 검증과 OpenAPI 스키마를 함께 도출. Drizzle 스키마와 정합(가능하면 `drizzle-zod`로 파생).
10. **인덱스**: `status`, `election`, `(sido, sigungu)`, `occurred_at`, `collected_at`에 인덱스(조회 필터·정렬 대상).
11. **pending 자동정리**: KV TTL이 없어지므로, 만료된 pending 레코드(+staging 객체)는 별도 메커니즘으로 정리(§5 — cron `scheduled` 또는 조회 시 lazy 삭제). R2 `_staging/` lifecycle(1일)은 유지.
12. **남용 방지 유지**: Turnstile siteverify + Cloudflare Rate Limiting(IP) + CORS(허용 오리진) — 0001 그대로.
13. **회귀 없음**: 제출→업로드→finalize 전 흐름이 vitest로 커버되고, 첨부 무결성(서버 해시 정본)·magic bytes 거부 동작이 유지된다.

## 5. 설계 개요

### 테이블 `reports` (최대한 flatten한 단일 테이블)

단일값 필드(region·verification 등)는 컬럼으로 펼치고, 진짜 배열(sources/attachments/rebuttals/tags/related)만 JSON 컬럼(SQLite `TEXT` + JSON)으로 둔다.

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `id` | TEXT PK | = submission_id |
| `status` | TEXT | `pending`(내부) / `unverified` / `reviewing` / `confirmed` / `disputed` / `debunked` / `corrected` |
| `election` | TEXT | 인덱스 |
| `title` | TEXT | |
| `summary` | TEXT NULL | |
| `body` | TEXT NULL | |
| `sido` / `sigungu` / `eup_myeon_dong` | TEXT NULL | region 펼침. (sido,sigungu) 인덱스 |
| `occurred_at` / `collected_at` | TEXT NULL/NN | ISO8601. 인덱스 |
| `tags` | TEXT(JSON) | 문자열 배열 |
| `sources` | TEXT(JSON) | `{url?,text?,type?,captured_at?,archive_url?}[]` |
| `attachments` | TEXT(JSON) | `{filename,r2_key,sha256,mime,size}[]` (정본 sha256은 서버 계산) |
| `exif` | TEXT(JSON) NULL | 클라 추출 요약 |
| `rebuttals` / `related` | TEXT(JSON) NULL | |
| `consent` | INTEGER | 0/1 |
| `submitter` | TEXT | 익명 해시. **조회 응답에서 제외** |
| `license` | TEXT | 기본 `CC-BY-4.0` |
| `verification_reviewer` / `verification_method` / `verification_reviewed_at` / `verification_notes` | TEXT NULL | verification 펼침(검수 스펙에서 사용, 본 스펙은 null로 생성) |
| `verification_evidence_links` | TEXT(JSON) NULL | |
| `finalize_token` | TEXT NULL | pending 동안만. finalize 후 NULL |
| `staging` | TEXT(JSON) NULL | pending 동안만. finalize 후 NULL |
| `created_at` / `updated_at` | TEXT | |

> JSON 컬럼 필터 한계: `tags` 포함 검색은 SQLite `json_each`/`LIKE`로 처리(§7). status/election/region/기간 등 주요 필터는 스칼라 컬럼이라 인덱스 활용.

### 흐름

```
POST /submissions
  Turnstile → rate limit → 정규화 → presigned 발급
  → D1 INSERT reports(status='pending', finalize_token, staging=[...])
  ← { submission_id, finalize_token, uploads:[{staging_key,put_url}] }

PUT put_url → R2 _staging/ (클라 직접)

POST /submissions/:id/finalize { finalize_token }
  → D1 select(status='pending', token 일치 확인)
  → staging read → magic bytes·크기 검증 → SHA-256 계산 → 정식 key 이동
  → D1 UPDATE reports SET status='unverified', attachments=[…r2_key,sha256…],
                          finalize_token=NULL, staging=NULL, collected_at=…
  ← { report_id, attachments }

GET /reports?election=&status=&sido=&tags=&from=&to=&cursor=&limit=
  → status != 'pending' 인 레코드, 필터·정렬·페이지네이션, 공개 필드만
GET /reports/:id → 단건(공개 필드). pending/없음 → 404
```

### 라우팅 / 문서 (`@hono/zod-openapi`)

- `OpenAPIHono` 인스턴스 + `createRoute`로 각 엔드포인트 정의(method/path/request schema/response schema). 핸들러는 `c.req.valid(...)`로 검증된 값 접근. `export default app`.
- `app.doc('/openapi.json', {...})`로 스펙 자동생성, `/reference`는 Scalar UI(기존 CDN standalone 유지).
- 기존 손수 `openapi.ts` 삭제. CORS·rate limit·Turnstile은 미들웨어/핸들러로 이식.

### D1 / Drizzle

- `drizzle.config.ts` + `schema.ts`(reports 테이블). `wrangler.jsonc`에 D1 바인딩(`migrations_dir: migrations`).
- 마이그레이션: drizzle-kit generate → `wrangler d1 migrations apply`(로컬/원격). 롤백은 새 마이그레이션으로(§7).
- 로컬: `wrangler dev`가 D1을 miniflare 로컬로 제공. 테스트는 `@cloudflare/vitest-pool-workers`의 D1 바인딩 사용.

### pending 정리

- 1차안: Worker `scheduled`(cron) 핸들러가 주기적으로 `status='pending' AND created_at < now-TTL` 레코드 삭제(+staging 객체 정리). R2 lifecycle이 staging 파일은 어차피 정리하므로 D1 행만 지워도 충분.
- 대안: 조회/제출 시 lazy 삭제. §7에서 확정.

### 실행 모드 (로컬 / 원격)

비-`--remote` `wrangler dev`는 R2가 miniflare 가짜인데 presigned PUT URL은 실제 R2를 가리켜, 업로드 목적지와 finalize 읽기가 갈려 첨부가 400 난다. 그래서 두 모드로 분리한다.

- **로컬(오프라인) `pnpm dev`/`dev:local`** (`--var LOCAL_UPLOAD:true`): presigned 대신 워커 자체 업로드 경로 `PUT /_dev/upload/*`가 로컬 R2에 staging 바이트를 받는다 → CF 접근/R2 자격증명 없이 전 흐름 동작. 이 경로는 `LOCAL_UPLOAD` 꺼지면 404(운영 미노출).
- **원격 `dev:remote`** (`--remote`): 실제 R2(presigned PUT)·원격 D1 사용. CF 자격증명·원격 D1 프로비저닝 필요.
- 가이드는 `docs/intake-api.md §5`.

## 6. 완료 조건 (Acceptance Criteria)

- [x] `POST /submissions`가 유효 요청에 `submission_id`+첨부별 presigned PUT URL을 반환하고, D1에 `status='pending'` 레코드가 생성된다. (test: "정상 제출은 200 + presigned URL + D1 pending 레코드")
- [x] Turnstile 실패 403, 근거(출처/첨부) 전무 시 거부, 동일 IP 과다요청 429 — 0001 동작 유지. (test 4건)
- [x] presigned PUT로 R2 직접 업로드가 동작한다(Worker 메모리 미경유). — presignPut(aws4fetch) 0001 그대로, `put_url`에 X-Amz-Signature 포함 확인(test). 실 R2 PUT은 0001에서 실측됨.
- [x] `finalize`가 magic bytes 불일치/허용목록 외/크기 초과를 거부하고, 통과 시 **서버 계산 SHA-256**을 레코드에 기록한다. (test: magic bytes 400 / 서버 sha256 정본)
- [x] `finalize` 통과 시 staging 객체가 정식 key로 이동되고, D1 레코드가 `status='unverified'`로 바뀌며 `finalize_token`/`staging`이 비워진다. (test: DB 행 검증)
- [x] `finalize` 응답은 `{ report_id, attachments }`이며 `issue_url`·GitHub 호출 경로가 코드에 존재하지 않는다(github.ts/github-app.ts/SIMULATE_GITHUB/Issue 빌더 제거). (test: issue_url undefined + grep: src 잔여 0)
- [x] `GET /reports`가 필터(election/status/sido/sigungu/tag/기간)와 페이지네이션·정렬(collected_at desc)로 동작하고, `status='pending'` 레코드는 노출하지 않는다. (test: 목록/태그 필터/pending 제외)
- [x] `GET /reports/{id}`가 단건 상세를 반환하고, 없거나 pending이면 404다. (test)
- [x] 조회 응답 어디에도 `submitter`(익명 해시)·`finalize_token`·`staging` 등 내부 필드가 노출되지 않는다. (test: 응답 텍스트에 미포함)
- [x] `GET /openapi.json`이 Zod 스키마에서 자동생성되어 실제 라우트와 일치하고, `GET /reference`(Scalar)가 그것을 로드한다. 손수 `openapi.ts`는 삭제됐다. (test: paths /submissions·/reports 포함, 3.1.0)
- [x] D1 마이그레이션(drizzle-kit/wrangler)으로 `reports` 테이블·인덱스가 생성되고 로컬·원격에 적용된다. (`db:generate` → `0000_*.sql`, `db:migrate:local` ✅, 원격 D1 `votatis-reports`(id `18dfa252…`) 생성 + `db:migrate:remote` ✅). `--remote`로 첨부 포함 전 흐름(PUT→finalize→조회) 라이브 검증 완료.
- [x] 만료 pending 레코드 정리 메커니즘(cron `scheduled` + `cleanupPending`)이 동작한다. (test: TTL 지난 pending 삭제)
- [x] `pnpm -r typecheck`·`pnpm --filter votatis-intake-api test`(21건) 통과. KV 바인딩이 제거됐다(rate limit는 D1로 이전).

## 7. 미해결 질문 / 리스크

- **"전부 공개" vs PRD 원칙**: 사용자 결정은 "status로만 구분, 전부 공개"다. 단, pending(업로드 미완료/고아) 내부상태는 조회에서 제외하기로 본 스펙에서 정했다. 미검증(unverified) 주장도 그대로 공개되므로 PRD 원칙1(검증 우선)·6(최소 노출)과의 긴장은 UI/표기(라벨)로 완화해야 한다 — 노출 정책 재검토 여지.
- **페이지네이션 방식**: cursor 기반(안정적) vs limit/offset(단순). 정렬 키(`collected_at`) 동률 처리 포함해 구현 시 택1.
- **pending 정리 메커니즘**: cron `scheduled` vs lazy 삭제 — TTL 값(예: 1시간)과 함께 확정.
- **tags 등 JSON 배열 필터**: SQLite `json_each`/`LIKE`로 처리. 데이터 증가 시 성능/정확도 — 필요하면 태그 정규화 테이블 도입 재검토(현재는 flatten 우선).
- **기존 GitHub Issue 데이터 이관**: 운영 축적분이 없다는 전제. 있다면 일회성 이관 스크립트 필요.
- **0001/0002 처리**: 본 스펙 완료 시 0001은 "대체됨", 0002는 "제거됨"으로 상태/인덱스 정리 필요(spec-review에서 결정).
- **검수 스펙(0007) 인터페이스**: `verification_*` 컬럼과 status 전이 규칙을 본 스펙에서 컬럼만 마련하고 동작은 다음 스펙으로 넘긴다 — 컬럼 설계가 검수 요구와 맞는지 사전 정합 필요.

## Changelog
기능/기술이 크게 바뀐 변경만 한 줄씩. 단순 버그·오타·리팩터링은 제외.
- 2026-06-10: 최초 작성
- 2026-06-10: 구현 완료 — 서버를 Hono + @hono/zod-openapi 로 재구성, D1(Drizzle, flatten `reports` + `rate_limits`) 도입, finalize→D1 적재(Issue 제거), `GET /reports`·`GET /reports/{id}` 공개 조회 추가, KV→D1(pending/rate limit) 이전, cron `cleanupPending`, GitHub 코드 전부 제거. 웹앱은 finalize 응답 `issue_url`→`report_id` 흡수. typecheck/test(21) 통과. in-review 이동.
- 2026-06-10: 원격 D1 `votatis-reports` 프로비저닝(wrangler.jsonc database_id 채움) + 원격 마이그레이션 적용, `wrangler dev --remote`로 첨부 포함 전 흐름 라이브 검증. GitHub App 자격증명(GITHUB_APP_ID/PRIVATE_KEY)을 .dev.vars/.prod.vars 및 관련 steering에서 제거. (요청: 채팅)
- 2026-06-10: 로컬/원격 실행 모드 분리 — 로컬 업로드 shim(`LOCAL_UPLOAD`+`PUT /_dev/upload/*`)으로 CF 접근 없이 첨부 흐름 동작, `pnpm dev:local`(=`--var LOCAL_UPLOAD:true`)·`dev:remote`(`--remote`) 스크립트 분리, docs §5에 로컬/원격 가이드 작성. 테스트 23건(로컬 shim 2건 포함). (요청: 채팅)
