---
id: "0001"
title: 제보 수집 API
status: completed
created: 2026-06-09
updated: 2026-06-10
related:
  - "docs/MVP-PRD.md §3 v1 범위"
  - "docs/MVP-PRD.md §5 데이터 수집 흐름"
  - "docs/MVP-PRD.md §8 제보 Form 매핑"
  - "https://developers.cloudflare.com/r2/api/s3/presigned-urls/"
  - "https://d3fend.mitre.org/technique/d3f:FileMagicByteVerification/"
---

# 제보 수집 API

## 1. 배경 / 문제

분산되어 사라지는 제보·증거를 검증 가능한 형태로 한곳에 모으려면, 누구나 접근할 수 있는 수집 진입점이 필요하다. 이 API는 PRD 아키텍처에서 `[제보자/크롤러] → [Cloudflare Worker] → [R2 / GitHub Issues]`의 첫 관문이다. Worker는 **수집과 정규화만** 담당하고 검증 판단은 하지 않는다(PRD §4 역할 분리).

핵심 난점은 익명 공개 엔드포인트라는 점이다. 스팸·봇·악성 파일에 노출되며, 동시에 PRD 원칙(검증 우선·출처 추적·무결성 증명·최소 노출)을 지켜야 한다.

## 2. 목표 (Goals)

- 웹앱(또는 크롤러)이 제보를 제출할 수 있는 HTTP API를 Cloudflare Worker로 제공한다.
- 첨부파일을 R2에 저장하고, 무결성 증명을 위해 SHA-256 해시를 **서버가 신뢰 가능하게** 산출한다.
- 정규화된 제보를 PRD 스키마 포맷의 GitHub Issue로 등록해 검증 큐에 올린다.
- 익명 공개 엔드포인트로서 봇·스팸·악성 업로드를 방어한다.

## 3. 비목표 (Non-Goals)

- 검증·승인·거절 판단 (사람/별도 도구의 몫).
- 승격 스크립트 / 레포 커밋 / 정적 사이트 (별도 스펙).
- 제보자 실명·신원 검증 (PRD §12 미결정 사항).
- 벡터/시맨틱 검색 (v2).
- 웹앱 UI 자체 (별도 스펙). 본 스펙은 웹앱이 호출하는 API 계약까지만 정의한다.

## 4. 요구사항

### 기능
1. **제출 개시 `POST /submissions`** — 제보 메타데이터(선거·제목·요약·내용·개표단위·지역·발생일시·출처 URL·태그)와 클라이언트가 추출한 EXIF 요약, 첨부 목록(파일명·MIME·크기·클라이언트 추정 sha256)을 받는다. Turnstile 토큰을 함께 받는다.
2. **첨부 직접 업로드** — 서버는 각 첨부에 대해 R2 presigned PUT URL을 발급한다. 클라이언트가 R2로 직접 업로드한다(Worker 메모리 경유 없음). presigned URL은 짧은 만료(예: 5분)와 고정 `r2_key`를 갖는다.
3. **제출 확정 `POST /submissions/{id}/finalize`** — 업로드 완료 후 호출. 서버가 R2 객체를 읽어 magic bytes·크기를 검증하고 **SHA-256 해시를 직접 계산**한다. 통과 시 PRD 스키마 포맷의 GitHub Issue를 생성한다.
4. **정규화** — 입력을 PRD §7 스키마(`occurred_at`/`collected_at` 분리, region 3단, sources에 captured_at 등)에 맞게 정규화한다. 판단·라벨링은 하지 않는다.
5. **근거 필수** — 출처(sources의 url 또는 text) 또는 첨부(attachments) 중 최소 하나가 있어야 등록 가능. 셋 다 없으면 거부(PRD 원칙2). source 항목은 url(웹사이트) 또는 text(직접 입력) 중 하나 이상 필요.
6. **익명 ID** — submitter는 익명 해시로만 기록. 실명·전화·이메일은 저장하지 않는다(PRD 원칙6).

### 비기능 (Best Practice 선택 반영)
7. **업로드/해시**: Presigned URL 직접 업로드 + finalize에서 서버가 R2 객체 재독해 SHA-256 산출(aws4fetch 사용, AWS SDK 미사용).
8. **EXIF 추출**: 클라이언트(웹앱)에서 추출해 메타만 전송. 원본은 서버를 경유하지 않는다(presigned로 R2 직행).
9. **남용 방지**: Cloudflare Rate Limiting(IP 기준) + Cloudflare Turnstile 검증.
10. **파일 검증**: magic bytes로 실제 타입 확인 + 크기 상한 + 허용 MIME 알리스트(이미지 위주). Content-Type 단독 신뢰 금지, polyglot 방어.
11. **CORS**: 웹앱 오리진만 허용. R2 버킷 CORS도 presigned 업로드 오리진으로 제한.
12. **고아 업로드 방지**: presigned 업로드는 `_staging/` prefix로 받고, pending 제출 상태는 Cloudflare KV에 TTL(예: 1시간)로 기록한다. finalize 통과 시에만 정식 key로 이동하고 KV 항목을 삭제한다. finalize되지 않은 staging 객체는 R2 lifecycle rule로 자동 삭제되고 KV 항목은 TTL로 만료되어, **정식 경로에는 검증 통과 데이터만 남는다**. (D1은 쓰지 않는다.)

### 기술 스택
- 런타임: Cloudflare Worker. 저장: R2(첨부) + KV(pending 제출 상태).
- 패키지 매니저: **pnpm**.
- R2 서명: aws4fetch (AWS SDK는 Workers 비호환이라 미사용).

## 5. 설계 개요

### 엔드포인트 흐름 (2-페이즈 업로드)

```
웹앱: 이미지 선택 → 클라에서 EXIF 추출 → Turnstile 토큰 획득
  │
  ├─(1) POST /submissions  { 제보 메타 + 첨부목록(파일명/MIME/크기) + turnstile_token }
  │        Worker: Turnstile 검증 → rate limit → 입력 정규화 →
  │                첨부별 presigned PUT URL 발급(staging key, 만료 5분) →
  │                pending 상태를 KV에 TTL(예: 1h)로 기록
  │        ← { submission_id, uploads: [{ staging_key, put_url }], finalize 토큰 }
  │
  ├─(2) 클라 → R2 presigned PUT 으로 _staging/ 에 첨부 직접 업로드
  │
  └─(3) POST /submissions/{id}/finalize  { finalize 토큰 }
           Worker: KV에서 pending 확인 → staging 객체 read → magic bytes + 크기 검증 →
                   SHA-256 계산 → 정식 key로 copy → GitHub Issue 생성 → KV 항목 삭제
           ← { issue_url }
   (finalize 안 됨 → staging 객체는 R2 lifecycle로, KV는 TTL로 자동 정리)
```

### 데이터/저장
- staging key: `_staging/{submission_id}/{filename}` — presigned 업로드 수신용. R2 lifecycle rule로 N시간 후 자동 삭제.
- 정식 key 규칙: `{election}/{submission_id}/{filename}` (PRD 예시와 정합). finalize 통과분만 여기로 copy.
- KV: `pending:{submission_id}` → 제출 메타·finalize 토큰. TTL로 미완료 자동 만료, finalize 시 삭제.
- GitHub Issue 본문: PRD §8 Issue Form과 1:1 포맷. 첨부는 정식 `r2_key` + 계산된 `sha256`로 채움.
- submitter: 요청 특성(예: IP+UA 등)에서 파생한 익명 해시. 원본 식별정보는 비저장.

### 보안
- Turnstile: 서버에서 siteverify로 토큰 검증 후에만 presigned 발급.
- presigned URL은 bearer 토큰처럼 취급 — 짧은 만료, Content-Type은 서명에 넣지 않음(aws4fetch signQuery 주의).
- finalize 시 해시는 **반드시 서버 계산값**을 정본으로 사용(클라 추정 sha256은 참고용).

## 6. 완료 조건 (Acceptance Criteria)

- [x] `POST /submissions`가 유효 요청에 submission_id와 첨부별 presigned PUT URL을 반환한다. (test: 정상 제출)
- [x] Turnstile 토큰이 없거나 검증 실패면 403으로 거부한다. (test: Turnstile 실패)
- [x] 출처(url/text)도 첨부도 없으면 등록을 거부한다. 출처는 url 또는 text 단독으로도 유효하고, 첨부만 있어도 등록 가능. (test: 근거 빈 / url·text 없는 source / 텍스트 출처만 / 첨부만)
- [x] presigned URL로 R2에 직접 업로드가 성공한다(Worker 메모리를 거치지 않음). — 실 R2 버킷 `votatis-evidence`에 presigned PUT 200 확인(2026-06-09, aws4fetch 서명 → 직접 PUT → 객체 내용 검증).
- [x] `finalize`가 R2 객체를 읽어 magic bytes 불일치/허용목록 외/크기 초과 파일을 거부한다. (test: magic bytes 불일치 → 400)
- [x] `finalize`가 서버에서 계산한 SHA-256을 Issue에 기록한다(클라 추정값과 무관하게 정본). (test: 정상 finalize)
- [x] `finalize` 통과 시 staging 객체가 정식 key로 이동되고 KV의 pending 항목이 삭제된다. (test: 정상 finalize)
- [x] finalize되지 않은 제출의 staging 객체는 R2 lifecycle로, KV 항목은 TTL로 자동 정리되어 정식 경로에 남지 않는다. — KV TTL(`PENDING_TTL_SECONDS`) 코드 구현 + R2 lifecycle rule `staging-cleanup`(`_staging/` prefix, 1일 만료) 실 버킷에 적용 완료(2026-06-09).
- [~] 생성된 GitHub Issue 본문이 PRD §7/§8 스키마 포맷과 일치한다(필수 필드 누락 없음). — `buildIssueBody`로 frontmatter 생성, submitter/status 유닛테스트 확인. 전체 필드 1:1 정합은 §8 Issue Form 확정 후 재대조 필요.
- [x] 동일 IP 과다 요청이 Rate Limiting으로 429 처리된다. (test: rate limit)
- [x] 저장·기록 어디에도 제보자 실명·전화·이메일이 남지 않는다(submitter는 익명 해시). (애초 미수신 + test: Issue 본문 익명)
- [x] CORS가 허용된 웹앱 오리진에서만 통과한다. (test: 비허용 오리진 403)

## 7. 미해결 질문 / 리스크

- staging TTL/lifecycle 구체 시간값(예: KV 1h vs R2 lifecycle 1d) 정합 — 둘 중 더 짧은 쪽 기준.
- Rate limit 구체 임계값(분당/시간당 요청 수)과 차단 기준.
- 크롤러 경로도 같은 API/Turnstile를 쓸지, 별도 인증 경로를 둘지(Turnstile는 사람 전제).
- 허용 첨부 타입 범위(이미지 외 PDF·동영상 허용 여부)와 파일 크기 상한 수치.
- GitHub API 호출용 토큰/봇 계정 운영 방식(레이트·권한 범위).

## Changelog
기능/기술이 크게 바뀐 변경만 한 줄씩. 단순 버그·오타·리팩터링은 제외.
- 2026-06-09: 최초 작성
- 2026-06-09: GitHub Issue 인증을 정적 PAT(`GITHUB_TOKEN`)에서 GitHub App(installation 토큰, `GITHUB_APP_ID`/`GITHUB_APP_PRIVATE_KEY`)으로 변경 — 봇 정체성 + 자동 만료 토큰. (요청: 채팅)
- 2026-06-09: OpenAPI 3.1 문서 제공 추가 — `GET /openapi.json`(스펙) + `GET /reference`(`/docs` alias, Scalar API Reference UI, CDN standalone). 의존성 추가 없음. (요청: 채팅)
- 2026-06-09: 출처 규칙 완화 — source 항목이 `url`(웹사이트) 또는 `text`(직접 입력) 중 하나면 유효. `sources`는 더 이상 필수가 아니며 출처(URL/텍스트)·첨부 중 최소 하나만 있으면 등록 가능. (요청: 채팅)
- 2026-06-10: 입력 스키마에서 `counting_unit`(개표 단위) 제거 — 불필요 데이터로 판단. `types.ts`·`openapi.ts`·Issue 본문(`github.ts`)에서 삭제. 클라(웹앱)도 함께 제거. (요청: 채팅)
- 2026-06-10: `SubmissionInput.consent`(익명 제보·공개 동의) 추가 — types/openapi/Issue 본문 기록 + vitest. (요청: 채팅, spec 0004)
- 2026-06-10: `wrangler.jsonc` KV·R2에 `preview_id`/`preview_bucket_name`(프로덕션 재사용) 추가 — `wrangler dev --remote`로 첨부 포함 흐름을 로컬에서 검증 가능하게. 운영 동작 불변. (요청: 채팅)
