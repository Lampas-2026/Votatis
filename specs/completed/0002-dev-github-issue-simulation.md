---
id: "0002"
title: 개발환경 GitHub Issue 시뮬레이션
status: completed
created: 2026-06-09
updated: 2026-06-09
related:
  - "specs/completed/0001-report-intake-api.md"
  - "docs/MVP-PRD.md §5 데이터 수집 흐름 / §6 검증 워크플로우"
  - "apps/intake-api/src/github.ts (createIssue)"
  - "apps/intake-api/src/github-app.ts (getInstallationToken)"
  - "https://developers.cloudflare.com/workers/development-testing/"
---

# 개발환경 GitHub Issue 시뮬레이션

## 1. 배경 / 문제

제보 수집 API(0001)는 finalize 단계에서 GitHub App 인증으로 installation 토큰을 발급받아
검증 큐인 GitHub Issue를 생성한다(`github.ts`→`github-app.ts`→`api.github.com`).

로컬에서 제출→finalize 전 흐름을 한 번 돌리려면 다음이 모두 필요하다:
- GitHub App 생성 + 대상 레포에 설치
- `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`(PEM) 를 `.dev.vars`에 채우기 (PEM 멀티라인 처리 주의)
- 매 테스트가 실제 레포에 Issue를 만들어 잡음 발생

이 셋업이 번거롭고, 실제 Issue를 만들기 때문에 디버깅·반복 테스트가 어렵다.
**개발 환경에서는 GitHub Issue 생성을 시뮬레이션**해, App 인증 없이 전 흐름을 돌리고
생성될 Issue 내용을 눈으로 확인할 수 있게 한다.

## 2. 목표 (Goals)

1. `SIMULATE_GITHUB` 플래그가 켜지면 finalize가 `api.github.com`을 전혀 호출하지 않고 가짜 Issue를 "생성"한다.
2. GitHub App secrets(`GITHUB_APP_ID`/`GITHUB_APP_PRIVATE_KEY`) 없이 `wrangler dev`에서 제출→finalize 전 흐름이 동작한다.
3. 시뮬레이션된 가짜 Issue를 `/simulate/issues/` 경로(API)에서 목록·상세(렌더된 본문 포함)로 확인할 수 있다. 로컬 디스크에 실제 파일로 떨구지는 않는다.
4. 운영(플래그 off, 기본값)에서는 동작이 0001과 완전히 동일하고, `/simulate/*` 경로는 존재하지 않는다(404).

## 3. 비목표 (Non-Goals)

- Turnstile 시뮬레이션 — 이미 공식 테스트 키로 우회 가능(문서화됨, `docs/intake-api.md §5`). 범위 밖.
- R2/KV 시뮬레이션 — Miniflare가 이미 로컬로 제공. 범위 밖.
- 시뮬레이션 Issue를 실제 로컬 디스크 `.md` 파일로 떨구는 기능 — 불필요. API(`/simulate/issues/`)로만 확인한다. §7 참고.
- 운영 환경에서의 시뮬레이션 — 플래그는 `.dev.vars`에만 두며 운영엔 넣지 않는다.

## 4. 요구사항

### 기능
1. **토글**: 명시적 env 플래그 `SIMULATE_GITHUB`. 값이 `"true"`(또는 `"1"`)일 때만 시뮬레이션. 기본 미설정 → off. `.dev.vars`에만 두고 `wrangler.jsonc` vars·운영 secrets엔 넣지 않는다.
2. **GitHub Issue 생성 분기**: `createIssue()` 내부에서 플래그가 켜져 있으면 실제 API/토큰 발급(`getInstallationToken`) 경로를 타지 않고 가짜 Issue를 만들어 `issue_url`을 반환한다.
3. **가짜 Issue 저장**: 가짜 Issue(번호, title, body, labels, created_at)를 KV에 저장한다.
4. **가짜 Issue 조회 경로**(시뮬레이션 모드에서만):
   - `GET /simulate/issues` → 저장된 가짜 Issue 목록(JSON).
   - `GET /simulate/issues/{n}` → 해당 Issue 상세. 렌더된 본문(`buildIssueBody` 결과 YAML+markdown)을 `text/markdown`으로 반환.
5. **issue_url 형식**: 시뮬레이션 시 `issue_url`은 위 조회 경로(`{base}/simulate/issues/{n}`)를 가리킨다. finalize 응답으로 그대로 내려가 클라가 바로 열어볼 수 있다.

### 비기능
6. 운영 기본(off)에서 코드 경로·응답은 0001과 동일해야 한다(회귀 없음).
7. 플래그 off일 때 `/simulate/*` 는 404 (운영에 dev 경로 노출 금지).
8. 단위 테스트로 시뮬레이션 모드의 finalize가 GitHub API를 호출하지 않음을 보장한다.

## 5. 설계 개요

### 토글
- `types.ts` `Env`에 `SIMULATE_GITHUB?: string` 추가.
- 헬퍼 `isSimulateGithub(env): boolean` (`env.SIMULATE_GITHUB === "true" || env.SIMULATE_GITHUB === "1"`).

### 생성 경로 (`github.ts`)
- `createIssue(env, title, body, labels, baseUrl)` 내부 첫 분기:
  ```
  if (isSimulateGithub(env)) return simulateCreateIssue(env, title, body, labels, baseUrl);
  ```
  실제 경로는 기존과 동일. 시뮬레이션 경로는 `getInstallationToken`/`fetch(api.github.com)`를 호출하지 않는다.
- `simulateCreateIssue`:
  - 가짜 Issue 번호 채번: KV 카운터(`sim:issue:seq`) 또는 timestamp 기반 id. dev 전용이라 엄밀한 원자성은 불요(§7).
  - KV에 `sim:issue:{n}` 키로 `{ number, title, body, labels, created_at }` 저장(현재 추가 TTL 없이 dev 세션 유지).
  - `issue_url = ${baseUrl}/simulate/issues/${n}` 반환.
- `baseUrl`은 `finalize.ts`에서 `new URL(request.url).origin`으로 만들어 `createIssue`에 전달.

### 조회 경로 (`index.ts`, 시뮬레이션 모드에서만 등록)
- `GET /simulate/issues` → KV `list({ prefix: "sim:issue:" })` 후 요약 JSON.
- `GET /simulate/issues/{n}` → KV get → `text/markdown` 본문 반환(없으면 404).
- 플래그 off면 두 경로 모두 일반 404 분기로 떨어진다.

### 흐름(시뮬레이션 모드)
```
POST /submissions → (Turnstile 테스트키 통과) → presigned (로컬 R2)
PUT put_url → 로컬 R2(_staging)
POST /submissions/{id}/finalize
  → magic bytes·SHA-256 검증(실제) → 정식 key 이동(로컬 R2)
  → createIssue: 시뮬레이션 → KV에 가짜 Issue 저장
  ← { issue_url: ".../simulate/issues/1", attachments }
GET /simulate/issues/1 → 생성됐을 Issue 본문 확인
```

## 6. 완료 조건 (Acceptance Criteria)

- [x] `SIMULATE_GITHUB=true`이면 finalize가 `api.github.com`(installation 조회/토큰 발급/issue 생성)을 호출하지 않는다. (test: GitHub fetchMock 없이 `disableNetConnect` 하에 200 → 미호출 증명)
- [x] GitHub App secrets가 없어도 시뮬레이션 모드 finalize가 200 + 가짜 `issue_url`을 반환한다. (sim 경로가 `getInstallationToken`/secrets를 읽지 않음, `github.ts:createIssue` 첫 분기)
- [x] `GET /simulate/issues`가 생성된 가짜 Issue 목록을, `GET /simulate/issues/{n}`가 렌더된 본문(`text/markdown`)을 반환한다. (test)
- [x] 플래그 off(기본)에서 finalize 동작은 0001과 동일하고, `/simulate/issues`·`/simulate/issues/{n}`는 404다. (test: off면 /simulate/issues 404)
- [x] 시뮬레이션 모드 finalize 단위 테스트 추가(GitHub fetchMock 없이 통과, KV에 가짜 Issue 적재 확인). (test 18개 통과)
- [x] `.dev.vars.example`에 `SIMULATE_GITHUB` 안내 추가, `docs/intake-api.md §4`에 로컬에서 GitHub 없이 돌리는 절 추가.

## 7. 미해결 질문 / 리스크

- **파일시스템 제약**: Worker(Miniflare) 런타임은 로컬 디스크에 직접 쓸 수 없다. `/simulate/issues/`는 실제 `.md` 파일이 아니라 KV 백업 + Worker 가상 경로(API)다. 디스크 파일로 떨구는 기능은 만들지 않기로 결정 — API로만 확인한다.
- **채번 동시성**: KV에는 원자적 increment가 없다. dev 전용·저부하라 timestamp 기반 id 또는 best-effort 카운터로 충분.
- **KV 잔존**: 가짜 Issue에 TTL을 둘지(자동 정리) 무기한 둘지 — 초기엔 무기한, 잡음이 쌓이면 `GET`에 정리용 삭제나 TTL 도입 검토.

## Changelog
기능/기술이 크게 바뀐 변경만 한 줄씩. 단순 버그·오타·리팩터링은 제외.
- 2026-06-09: 최초 작성
- 2026-06-09: 구현 완료 — `SIMULATE_GITHUB` 플래그, `github.ts` createIssue 시뮬레이션 분기 + KV 저장, `/.simulate/issues[/{n}]` 조회 경로, 테스트 18개 통과.
- 2026-06-09: 조회 경로 prefix를 `/.simulate` → `/simulate`로 변경(앞 `.` 제거). 디스크 `.md` 파일 출력 기능은 불필요로 확정(API로만 확인). (요청: 채팅)
