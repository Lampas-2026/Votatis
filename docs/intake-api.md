# intake-api — 제보 수집 API 운영 문서

제보를 받아 첨부를 R2에 저장하고, 검증 큐(GitHub Issue)로 올리는 Cloudflare Worker.
스펙: [`specs/completed/0001-report-intake-api.md`](../specs/completed/0001-report-intake-api.md) · 코드: `apps/intake-api/`

## 1. 동작 개요

2단계 업로드(presigned)로 동작한다.

```
웹앱 → 클라에서 EXIF 추출, Turnstile 토큰 획득
  (1) POST /submissions      제보 메타 + 첨부목록 + turnstile_token
        Worker: Turnstile 검증 → IP rate limit → presigned PUT URL(staging) 발급 → KV에 pending 기록
        ← { submission_id, finalize_token, uploads: [{ staging_key, put_url }] }
  (2) PUT put_url            클라가 R2(_staging/)에 첨부 직접 업로드
  (3) POST /submissions/:id/finalize   finalize_token
        Worker: staging 객체 read → magic bytes·크기 검증 → SHA-256 계산 →
                정식 key로 이동 → GitHub Issue 생성(봇) → KV 삭제
        ← { issue_url, attachments }
```

- finalize 안 된 제출: staging 객체는 R2 lifecycle(1일), KV는 TTL(1시간)로 자동 정리 → 정식 경로엔 검증 통과분만 남는다.
- 첨부 해시는 **서버가 계산한 값이 정본**(무결성). 인증은 **GitHub App(봇)** 토큰.

## 2. 설정값

### `apps/intake-api/wrangler.jsonc` — vars (공개 가능, 코드에 커밋됨)

| 키 | 현재 값 | 설명 |
|----|---------|------|
| `ALLOWED_ORIGIN` | `http://localhost:5173` | CORS 허용 오리진. **배포 도메인이 생기면 반드시 변경.** |
| `GITHUB_REPO` | `3dulev/votatis-data` | Issue를 만들 대상 레포 |
| `R2_ACCOUNT_ID` | `4691f0338d03a2e7d000403d13b66264` | presigned 서명용 R2 계정 ID |
| `R2_BUCKET` | `votatis-evidence` | 첨부 저장 버킷 |

바인딩: `PENDING_KV`(KV, id `c6c9431e…`), `EVIDENCE_BUCKET`(R2 `votatis-evidence`).

### Secrets (코드에 두지 않음 — `wrangler secret` / `.dev.vars` / `.prod.vars`)

| 키 | 설명 |
|----|------|
| `TURNSTILE_SECRET` | Turnstile 위젯 secret |
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key (PEM). 멀티라인 — 아래 주의 참고 |
| `R2_ACCESS_KEY_ID` | R2 S3 API 토큰 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 S3 API 토큰 Secret |

### 외부 리소스 (이미 프로비저닝됨)

- Worker: **https://votatis-intake-api.3dulev.workers.dev**
- R2 버킷 `votatis-evidence` + CORS(`apps/intake-api/r2-cors.json`) + lifecycle `staging-cleanup`(`_staging/` 1일)
- KV `PENDING_KV`
- Turnstile 위젯 `votatis-bot` — **sitekey `0x4AAAAAADhXh1OGOie5kiwQ`**(공개, 웹앱 프런트에 사용), domains `localhost`
- GitHub App `votatis-bot` — `votatis-data`에 설치, `Issues: write`

## 3. 배포

```bash
# 1) 의존성 (루트에서, 최초 1회)
pnpm install

# 2) secrets 등록 (apps/intake-api 의 .prod.vars 를 JSON 으로 변환해 bulk)
#    .prod.vars 는 dotenv 형식이며 PEM 은 한 줄(\n literal). 업로드 시 실제 개행으로 풀어야 한다.
cd apps/intake-api
# (PEM \n 복원 후 bulk — 자세한 변환은 아래 "주의: PEM" 참고)
wrangler secret bulk <(node -e '
  const fs=require("fs");const o={};
  for(const l of fs.readFileSync(".prod.vars","utf8").split("\n")){
    const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);if(!m)continue;
    let v=m[2];if(/^".*"$/.test(v)||/^'"'"'.*'"'"'$/.test(v))v=v.slice(1,-1);
    o[m[1]]=v.replace(/\\n/g,"\n");}
  process.stdout.write(JSON.stringify(o));')

# 3) 배포
pnpm --filter votatis-intake-api deploy   # 루트에서. 또는 apps/intake-api 에서 `wrangler deploy`
```

배포 후 헬스 체크: `curl https://votatis-intake-api.3dulev.workers.dev/health` → `ok`

### API 문서 (OpenAPI / Scalar)

- `GET /openapi.json` — OpenAPI 3.1 스펙 (손으로 작성, `apps/intake-api/src/openapi.ts`). 라우트·스키마를 바꾸면 이 파일도 갱신할 것.
- `GET /reference` (alias `GET /docs`) — Scalar API Reference UI. 스펙을 `/openapi.json`에서 로드한다. CDN standalone이라 별도 의존성 없음.
- 예: https://votatis-intake-api.3dulev.workers.dev/reference

> **wrangler CLI 인증**: 루트 `.env`의 `CF_API_TOKEN`/`CF_ACCOUNT_ID`를 쓴다.
> `set -a; . ./.env; set +a; export CLOUDFLARE_API_TOKEN=$CF_API_TOKEN CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID`

> **주의: PEM** — GitHub App private key는 PKCS#1(`BEGIN RSA PRIVATE KEY`)이며 `.dev.vars`/`.prod.vars`엔 한 줄(`\n` literal)로 둔다. secret으로 올릴 땐 `\n`을 실제 개행으로 풀어야 worker의 키 파싱(`pemToDer`)이 동작한다. `wrangler dev`는 `.dev.vars`의 `\n`을 자동으로 개행 처리한다.

## 4. 로컬 개발 (wrangler dev)

```bash
cd apps/intake-api
cp .dev.vars.example .dev.vars   # 최초 1회, 값 채우기
pnpm dev                          # = wrangler dev, 기본 http://localhost:8787
```

- `wrangler dev`는 R2/KV를 **로컬(miniflare) 시뮬레이션**으로 쓴다. 실제 R2/KV에 붙이려면 `wrangler dev --remote`.
- 단위 테스트(외부 의존 mock): `pnpm test` (vitest, 12 케이스) / 타입: `pnpm typecheck`. 루트에선 `pnpm -r test`.

### 로컬에서 제출 흐름 찔러보기

`.dev.vars`의 `TURNSTILE_SECRET`을 아래 "항상 통과" 테스트 secret으로 바꾸면 위젯 없이 제출을 테스트할 수 있다.

```bash
curl -X POST http://localhost:8787/submissions \
  -H "content-type: application/json" \
  -H "origin: http://localhost:5173" \
  -d '{
    "election": "제8회 전국동시지방선거",
    "title": "로컬 테스트",
    "sources": [{ "url": "https://example.com" }],
    "attachments": [{ "filename": "a.jpg", "mime": "image/jpeg", "size": 1000 }],
    "turnstile_token": "dummy"
  }'
```

응답의 `uploads[].put_url`로 파일을 PUT(`--remote`일 때 실제 R2), 그 다음 `finalize_token`으로 `POST /submissions/{id}/finalize`.

### GitHub 없이 로컬에서 finalize까지 돌리기 (시뮬레이션 모드)

finalize는 원래 GitHub App 인증으로 실제 Issue를 만든다. 로컬에서 App 셋업 없이 전 흐름을 돌리려면 `.dev.vars`에 아래를 켠다.

```bash
SIMULATE_GITHUB="true"
```

- 켜지면 finalize가 `api.github.com`을 호출하지 않고 가짜 Issue를 만들어 `issue_url`로 `/simulate/issues/{n}`을 돌려준다. `GITHUB_APP_ID`/`GITHUB_APP_PRIVATE_KEY`는 비어 있어도 된다.
- 가짜 Issue 확인: `GET /simulate/issues`(목록 JSON), `GET /simulate/issues/{n}`(생성됐을 Issue 본문, `text/markdown`).
- 이 경로들은 **시뮬레이션 모드에서만** 열린다. 플래그가 없으면 404 → 운영엔 노출되지 않는다. 스펙: [`specs/.../0002-dev-github-issue-simulation.md`](../specs/in-progress/0002-dev-github-issue-simulation.md).

## 5. Turnstile — 테스트/개발에서 우회하기

Cloudflare가 제공하는 **공식 테스트 키**를 쓴다. 실제 사람 인증 없이 항상 통과/실패시킬 수 있다.

### Secret key (서버 — `TURNSTILE_SECRET`에 넣음)

| 값 | 동작 |
|----|------|
| `1x0000000000000000000000000000000AA` | siteverify 항상 **통과** |
| `2x0000000000000000000000000000000AA` | 항상 **실패** |
| `3x0000000000000000000000000000000AA` | "token already spent" 에러 |

### Site key (클라이언트 — 웹앱 위젯)

| 값 | 동작 |
|----|------|
| `1x00000000000000000000AA` | 항상 통과 (visible) |
| `2x00000000000000000000AB` | 항상 차단 |
| `1x00000000000000000000BB` | 항상 통과 (invisible) |
| `3x00000000000000000000FF` | 강제 인터랙티브 챌린지 |

- 더미 토큰: `XXXX.DUMMY.TOKEN.XXXX` (또는 항상-통과 secret이면 아무 비어있지 않은 문자열도 OK)
- **로컬 개발**: `.dev.vars`의 `TURNSTILE_SECRET`을 `1x0000…AA`로 두면 어떤 토큰이든 통과 → 위젯 없이 흐름 테스트.
- **단위 테스트(vitest)**: siteverify를 `fetchMock`으로 가로채므로 실제 Turnstile을 타지 않는다. 실 키 불필요.
- **운영**: 실제 위젯 secret 사용. sitekey `0x4AAAAAADhXh1OGOie5kiwQ`. 배포 도메인이 생기면 Turnstile 위젯 `domains`에 추가.

## 6. 배포 도메인이 정해지면 (체크리스트)

1. `wrangler.jsonc`의 `ALLOWED_ORIGIN`을 운영 도메인으로
2. `apps/intake-api/r2-cors.json`의 `origins`를 운영 도메인으로 → `wrangler r2 bucket cors set votatis-evidence --file r2-cors.json`
3. Turnstile 위젯 `domains`에 운영 도메인 추가 (대시보드 또는 API)
4. 재배포
