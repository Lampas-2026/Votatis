# intake-api — 제보 수집 + 조회 API

제보를 받아 첨부를 R2에 저장하고, 정규화된 레코드를 **D1(SQLite)**에 적재하며, 공개 조회 API를 제공하는 Cloudflare Worker (Hono + OpenAPI + Zod).
스펙: [`specs/.../0006-d1-report-store-api.md`](../specs/in-progress/0006-d1-report-store-api.md) (0001/0002 대체) · 코드: `apps/intake-api/`

## 1. 동작 개요

2단계 업로드(presigned)로 제출하고, finalize 시 D1에 확정 레코드를 적재한다.

```
웹앱 → 클라에서 EXIF 추출, Turnstile 토큰 획득
  (1) POST /submissions      제보 메타 + 첨부목록 + turnstile_token
        Worker: Turnstile 검증 → IP rate limit(D1) → presigned PUT URL(staging) 발급
                → D1 reports INSERT (status='pending')
        ← { submission_id, finalize_token, uploads: [{ staging_key, put_url }] }
  (2) PUT put_url            클라가 R2(_staging/)에 첨부 직접 업로드
  (3) POST /submissions/:id/finalize   finalize_token
        Worker: staging 객체 read → magic bytes·크기 검증 → SHA-256 계산 →
                정식 key로 이동 → D1 UPDATE (status='unverified', finalize_token/staging 비움)
        ← { report_id, attachments }

조회(공개):
  GET /reports?election=&status=&sido=&sigungu=&tag=&from=&to=&limit=&offset=
        → pending 제외, 필터·정렬(collected_at desc)·페이지네이션. 요약 목록.
  GET /reports/:id   → 단건 상세(공개 필드). 없거나 pending 이면 404.
```

- 미완료(pending) 제출: staging 객체는 R2 lifecycle(1일), D1 pending 레코드는 cron(`scheduled`, 30분 주기 / TTL 1h)으로 정리 → 정식 조회엔 검증 흐름을 통과한 것만 남는다.
- 첨부 해시는 **서버가 계산한 값이 정본**(무결성). 조회 응답에는 `submitter`(익명 해시)·`finalize_token`·`staging` 등 내부 필드를 노출하지 않는다.
- **GitHub Issue 연동은 제거됨** — 검증 큐/저장소는 D1이다.

## 2. 설정값

### `apps/intake-api/wrangler.jsonc` — vars (공개 가능, 코드에 커밋됨)

| 키 | 현재 값 | 설명 |
|----|---------|------|
| `ALLOWED_ORIGIN` | `http://localhost:3000,https://votatis-web.pages.dev` | 쓰기(POST) CORS 허용 오리진(쉼표 구분). 읽기(GET)는 공개. |
| `R2_ACCOUNT_ID` | `4691f0338d03a2e7d000403d13b66264` | presigned 서명용 R2 계정 ID |
| `R2_BUCKET` | `votatis-evidence` | 첨부 저장 버킷 |

바인딩: `EVIDENCE_BUCKET`(R2 `votatis-evidence`), `DB`(D1 `votatis-reports`). KV는 더 이상 쓰지 않는다.

### Secrets (코드에 두지 않음 — `wrangler secret` / `.dev.vars` / `.prod.vars`)

| 키 | 설명 |
|----|------|
| `TURNSTILE_SECRET` | Turnstile 위젯 secret |
| `R2_ACCESS_KEY_ID` | R2 S3 API 토큰 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 S3 API 토큰 Secret |

### 외부 리소스

- Worker: **https://votatis-intake-api.3dulev.workers.dev**
- R2 버킷 `votatis-evidence` + CORS(`apps/intake-api/r2-cors.json`) + lifecycle `staging-cleanup`(`_staging/` 1일)
- D1 `votatis-reports` — 생성됨(`database_id` `wrangler.jsonc`에 기입, 원격 마이그레이션 적용). 첨부 포함 흐름은 R2가 실제라야 해서 `wrangler dev --remote`로 돌린다(로컬 `wrangler dev`는 R2가 miniflare라 presigned PUT 목적지와 finalize 읽기가 갈려 첨부가 400). dev `--remote`는 운영 D1을 직접 쓰므로, 잡음을 피하려면 `preview_database_id`(별도 preview D1) 도입 고려.
- Turnstile 위젯 `votatis-bot` — sitekey `0x4AAAAAADhXh1OGOie5kiwQ`(공개, 웹앱 프런트), domains `localhost`

## 3. DB 마이그레이션 (D1 + Drizzle)

스키마는 `src/db/schema.ts`(Drizzle). SQL 마이그레이션은 drizzle-kit 으로 생성하고 wrangler 로 적용한다.

```bash
cd apps/intake-api
pnpm db:generate          # 스키마 변경 시 migrations/*.sql 생성 (drizzle-kit)
pnpm db:migrate:local     # 로컬(.wrangler) D1 에 적용
pnpm db:migrate:remote    # 원격 D1 에 적용 (CF 인증 필요)
```

## 4. 배포

```bash
# 1) 의존성 (루트에서, 최초 1회)
pnpm install

# 2) D1 생성(최초 1회) + wrangler.jsonc 의 database_id 채우기
cd apps/intake-api
wrangler d1 create votatis-reports     # 출력된 database_id 를 wrangler.jsonc 에 기입

# 3) 원격 마이그레이션 적용
pnpm db:migrate:remote

# 4) secrets 등록 (.prod.vars 를 JSON 으로 bulk)
wrangler secret bulk <(node -e '
  const fs=require("fs");const o={};
  for(const l of fs.readFileSync(".prod.vars","utf8").split("\n")){
    const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);if(!m)continue;
    let v=m[2];if(/^".*"$/.test(v)||/^'"'"'.*'"'"'$/.test(v))v=v.slice(1,-1);
    o[m[1]]=v;}
  process.stdout.write(JSON.stringify(o));')

# 5) 배포
pnpm --filter votatis-intake-api run deploy   # 루트에서. 또는 apps/intake-api 에서 `wrangler deploy`
```

배포 후 헬스 체크: `curl https://votatis-intake-api.3dulev.workers.dev/health` → `ok`

### API 문서 (OpenAPI / Scalar)

- `GET /openapi.json` — OpenAPI 3.1 스펙. `@hono/zod-openapi`가 라우트의 Zod 스키마에서 **자동 생성**한다(손수 유지하던 `openapi.ts` 제거).
- `GET /reference` (alias `GET /docs`) — Scalar API Reference UI. `/openapi.json`을 로드한다(CDN standalone).

> **wrangler CLI 인증**: 루트 `.env`의 `CF_API_TOKEN`/`CF_ACCOUNT_ID`를 쓴다.
> `set -a; . ./.env; set +a; export CLOUDFLARE_API_TOKEN=$CF_API_TOKEN CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID`

## 5. 로컬 개발 — 두 가지 실행 모드

intake-api는 **로컬(오프라인) 모드**와 **원격 모드** 두 가지로 돌릴 수 있다. 명령어가 분리돼 있다.

| | `pnpm dev` / `pnpm dev:local` | `pnpm dev:remote` |
|---|---|---|
| R2 | 로컬 miniflare(가짜) | **실제** `votatis-evidence` |
| D1 | 로컬 SQLite(`.wrangler/state`) | **실제** `votatis-reports` |
| 첨부 업로드 | 워커 자체 `/_dev/upload`(`LOCAL_UPLOAD`) | presigned PUT → 실 R2 |
| **Cloudflare 접근 권한** | **불필요** | **필요**(R2 자격증명·CF 토큰) |
| 데이터 격리 | 완전 로컬, 운영 무영향 | **운영 D1·R2를 직접 사용**(주의) |

> 핵심: 비-`--remote` `wrangler dev`에서 R2는 miniflare 가짜인데 presigned PUT URL은 **실제 R2**를 가리켜, 업로드 목적지와 finalize 읽기가 갈려 첨부가 400 난다. 그래서 로컬 모드는 `LOCAL_UPLOAD=true`로 presigned 대신 **워커 자체 업로드 경로**(`PUT /_dev/upload/*`)를 써서 로컬 R2에 받는다(운영에선 이 경로가 404).

### 5-1. 로컬(오프라인) 모드 — CF 접근 없이

Cloudflare 계정/권한이 없어도 전 흐름(제출→업로드→finalize→조회)이 돈다.

```bash
cd apps/intake-api
cp .dev.vars.example .dev.vars   # 최초 1회
#  .dev.vars 에 최소: TURNSTILE_SECRET="1x0000000000000000000000000000000AA"(항상 통과 테스트키)
#  R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY 는 로컬 모드에선 안 쓰이므로 비워도 됨.
pnpm db:migrate:local            # 로컬 D1 스키마 적용(최초 1회 / 스키마 변경 시)
pnpm dev:local                   # = wrangler dev --var LOCAL_UPLOAD:true, http://localhost:8787
```

찔러보기(더미 토큰 통과):

```bash
# 1) 제출
curl -s -X POST localhost:8787/submissions -H 'content-type: application/json' -H 'origin: http://localhost:3000' \
  -d '{"election":"테스트","title":"로컬","attachments":[{"filename":"a.jpg","mime":"image/jpeg","size":22}],"turnstile_token":"dummy"}'
# 2) 응답의 put_url(=…/_dev/upload/…) 로 파일 PUT
curl -s -X PUT "<put_url>" -H 'origin: http://localhost:3000' --data-binary @a.jpg
# 3) finalize → 4) GET /reports 로 확인
curl -s -X POST localhost:8787/submissions/<id>/finalize -H 'content-type: application/json' -H 'origin: http://localhost:3000' -d '{"finalize_token":"<token>"}'
```

### 5-2. 원격 모드 — 실제 R2·D1

실제 R2 첨부/원격 D1까지 붙여 확인할 때. **필요한 환경변수/사전조건:**

1. **Cloudflare CLI 인증** — 루트 `.env`의 `CF_API_TOKEN`·`CF_ACCOUNT_ID`를 export:
   ```bash
   set -a; . ./.env; set +a
   export CLOUDFLARE_API_TOKEN=$CF_API_TOKEN CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID
   ```
2. **`.dev.vars` 시크릿** — presigned 서명에 실 R2 자격증명 필요:
   - `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` (R2 S3 API 토큰)
   - `TURNSTILE_SECRET` (테스트키 `1x0000…AA` 가능, 또는 실제 위젯 secret)
3. **원격 D1 존재** — `wrangler.jsonc`의 `d1_databases[].database_id`가 실제 D1(`votatis-reports`)을 가리켜야 하고, 원격 마이그레이션이 적용돼 있어야 한다(`pnpm db:migrate:remote`).

```bash
cd apps/intake-api
pnpm dev:remote                  # = wrangler dev --remote, http://localhost:8787
```

> ⚠️ `dev:remote`는 **운영 D1·R2를 직접 사용**한다 — dev 중 올린 제보가 운영 데이터에 쌓인다. 격리하려면 별도 preview D1(`wrangler d1 create … ` → `wrangler.jsonc`에 `preview_database_id`)을 두는 것을 권장.

### 5-3. 테스트

- 단위/통합: `pnpm test` (vitest, `@cloudflare/vitest-pool-workers` + 로컬 D1, 마이그레이션 자동 적용. 로컬 업로드 shim 포함). 타입: `pnpm typecheck`. 루트에선 `pnpm -r test` / `pnpm -r typecheck`.

## 6. Turnstile — 테스트/개발에서 우회하기

Cloudflare 공식 **테스트 키**를 쓴다. 실제 사람 인증 없이 항상 통과/실패시킬 수 있다.

### Secret key (서버 — `TURNSTILE_SECRET`)

| 값 | 동작 |
|----|------|
| `1x0000000000000000000000000000000AA` | siteverify 항상 **통과** |
| `2x0000000000000000000000000000000AA` | 항상 **실패** |
| `3x0000000000000000000000000000000AA` | "token already spent" 에러 |

### Site key (클라이언트 — 웹앱 위젯)

| 값 | 동작 |
|----|------|
| `1x00000000000000000000AA` | 항상 통과 (visible) |
| `1x00000000000000000000BB` | 항상 통과 (invisible) |
| `2x00000000000000000000AB` | 항상 차단 |

- **로컬 개발**: `.dev.vars`의 `TURNSTILE_SECRET`을 `1x0000…AA`로 두면 어떤 토큰이든 통과.
- **단위 테스트(vitest)**: siteverify를 `fetchMock`으로 가로채므로 실 키 불필요.
- **운영**: 실제 위젯 secret 사용. 배포 도메인이 생기면 Turnstile 위젯 `domains`에 추가.

## 7. 배포 도메인이 정해지면 (체크리스트)

1. `wrangler.jsonc`의 `ALLOWED_ORIGIN`(쓰기 CORS)을 운영 도메인 포함으로
2. `apps/intake-api/r2-cors.json`의 `origins`를 운영 도메인으로 → `wrangler r2 bucket cors set votatis-evidence --file r2-cors.json`
3. Turnstile 위젯 `domains`에 운영 도메인 추가
4. 재배포
