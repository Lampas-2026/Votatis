---
id: "0003"
title: 제보 웹앱 (임시)
status: completed
created: 2026-06-09
updated: 2026-06-10
related:
  - "docs/MVP-PRD.md §5 데이터 수집 흐름"
  - "docs/MVP-PRD.md §11 웹 기획"
  - "specs/completed/0001-report-intake-api.md (API 계약)"
  - "docs/intake-api.md (엔드포인트·Turnstile 테스트키)"
  - "https://docs.astro.build/en/guides/islands/"
  - "https://docs.astro.build/en/guides/deploy/github/"
  - "https://tailwindcss.com/docs/installation/framework-guides/astro"
---

# 제보 웹앱 (임시)

## 1. 배경 / 문제

PRD 아키텍처의 첫 관문인 제보 수집 API(`0001`)는 완료됐지만, GitHub 계정이 없는 일반 제보자가 제보를 넣을 진입점이 아직 없다(PRD §8 "GitHub 계정이 없는 경우 웹앱에서 API 통해서 등록"). 제보 흐름 전체(클라 EXIF 추출 → Turnstile → presigned 업로드 → finalize)를 사람이 실제로 통과시켜 볼 수 있는 **최소 웹앱**이 필요하다.

"임시"라는 단서가 핵심이다. 지금은 제보 폼 하나로 전 흐름을 검증하는 게 목적이고, 소개·탐색 같은 페이지는 이후 별도 스펙에서 같은 앱에 얹는다. 이 프로젝트는 결국 콘텐츠 아카이브 + 클라이언트 검색(PRD §9·§11)이 중심이므로, 콘텐츠 페이지는 **zero-JS 정적 HTML**로 내고 인터랙션이 필요한 부분(제보 폼)만 자바스크립트를 보내는 **Astro islands** 구조가 적합하다. SPA는 쓰지 않는다. 따라서 처음부터 **라우트마다 정적 HTML이 생성되는 Astro 정적 빌드(`output: 'static'`)** 환경으로 세팅하되, 화면 자체는 제보 폼 라우트만 만든다. 페이지가 늘면 `src/pages/`에 라우트를 추가하기만 하면 된다.

## 2. 목표 (Goals)

- intake-api의 2단계 업로드 흐름(`POST /submissions` → presigned `PUT` → `POST /submissions/{id}/finalize`)을 끝까지 통과시키는 제보 폼 페이지를 만든다.
- 클라이언트에서 EXIF를 추출해 메타로 전송한다(원본은 서버를 경유하지 않고 R2로 직행 — `0001` 요구사항 8).
- Cloudflare Turnstile 위젯으로 토큰을 획득해 제출에 포함한다.
- **Astro 정적 빌드(islands)로 라우트마다 개별 정적 HTML이 빌드되는 환경**을 세팅해, GitHub Pages와 Cloudflare Pages 양쪽에 런타임 서버 없이 같은 코드로 배포 가능하게 한다(향후 페이지 확장 전제).
- 제출 성공 시 결과(생성된 Issue URL, 첨부별 r2_key/sha256)를 사용자에게 보여준다.

## 3. 비목표 (Non-Goals)

- 소개·탐색·목록·검색 페이지 (별도 스펙. 정적 사이트+검색은 PRD §9 / 후속 스펙 대상). 이번엔 제보 폼 라우트 하나만.
- 제보 수정/삭제, 제보자 계정·로그인 (PRD §12 미결정).
- 런타임 SSR·SPA — Astro `output: 'static'`으로 빌드 타임에만 HTML을 생성한다(정적 호스팅 전제, 서버 없음). 단일 SPA로 만들지 않는다.
- intake-api 자체 변경(엔드포인트는 `0001` 계약 그대로 소비). 단, 배포 도메인 확정 시 API의 `ALLOWED_ORIGIN`·R2 CORS·Turnstile domains 갱신은 운영 체크리스트로 본 스펙 §7에 남긴다.
- 디자인 시스템/브랜딩. 임시 수준의 단정한 폼이면 된다.

## 4. 요구사항

### 기능
1. **제보 폼** — PRD §8 폼 매핑과 `0001` `POST /submissions` 입력에 맞춰 다음 필드를 받는다: 선거 종류, 제목, 요약, 내용, 개표 단위, 지역(시도/시군구), 발생일시, 출처 URL(복수), 출처 텍스트, 태그, 첨부 이미지(복수).
2. **근거 필수 검증(클라)** — 출처(url 또는 text) 또는 첨부 중 최소 하나가 없으면 제출 버튼을 막거나 에러를 띄운다(서버도 거부하지만 UX상 선제 검증).
3. **EXIF 추출** — 첨부 이미지 선택 시 클라이언트에서 EXIF를 추출해(`exifr`) 메타 요약을 함께 전송한다. 원본 바이트는 presigned `PUT`로 R2에 직접 올린다.
4. **Turnstile 위젯** — 위젯에서 토큰을 받아 `POST /submissions`의 `turnstile_token`으로 보낸다. 로컬은 테스트 sitekey(`1x00000000000000000000AA`), 운영은 `0x4AAAAAADhXh1OGOie5kiwQ`.
5. **2단계 업로드 오케스트레이션** — (1) `POST /submissions`로 메타+첨부목록+토큰 제출 → 응답의 `uploads[].put_url`로 각 첨부를 R2에 직접 `PUT` → (3) `finalize_token`으로 `POST /submissions/{id}/finalize` 호출.
6. **진행/결과 표시** — 업로드 진행 상태와, finalize 응답(`issue_url`, `attachments`)을 화면에 보여준다. 실패 단계(Turnstile 실패 403, rate limit 429, 파일 검증 400 등)는 사용자에게 구분해 안내한다.

### 비기능 / 환경 (배포 호환성)
7. **정적 라우트 빌드 (Astro islands)** — Astro(`output: 'static'`)를 쓴다. `src/pages/`의 각 라우트가 정적 HTML로 빌드되고, 콘텐츠는 zero-JS로 나간다. 인터랙션이 필요한 부분(제보 폼)만 React 컴포넌트를 `client:load` island로 하이드레이션한다. 라우트를 늘리면 `src/pages/`에 페이지를 추가한다.
8. **이중 배포 호환** — base path를 환경변수(예: `PUBLIC_BASE_PATH`)로 받아 `astro.config`의 `base`(및 필요 시 `site`)에 주입한다. Cloudflare Pages/커스텀 도메인은 `/`, GitHub Pages 프로젝트 페이지는 `/<repo>/`. 같은 소스로 양쪽 빌드한다.
9. **404 처리** — `src/pages/404.astro`를 두면 빌드 시 `dist/404.html`이 생성되어 GitHub Pages가 자동 인식한다. Cloudflare Pages도 `dist`를 그대로 서빙하며 404를 처리한다. SPA fallback 트릭은 불필요(라우트가 실제 정적 HTML이므로 딥링크 새로고침이 그대로 동작).
10. **API base URL 주입** — `PUBLIC_API_BASE_URL` 환경변수로 API 엔드포인트를 주입한다(로컬 `http://localhost:8787`, 운영 `https://votatis-intake-api.3dulev.workers.dev`).
11. **스타일링** — Tailwind CSS v4(`@tailwindcss/vite`). Astro는 Vite 기반이라 `astro.config`의 `vite.plugins`에 `tailwindcss()`를 꽂는다(`@astrojs/tailwind` 통합은 v4에서 deprecated). `src/styles/global.css`에 `@import "tailwindcss";`를 두고 레이아웃에서 한 번 import. `.astro`와 React island가 같은 유틸리티 클래스를 공유한다. zero-runtime(빌드 시 사용분만 출력).
12. **모노레포 정합** — 앱은 `apps/web/`에 두고 pnpm workspace에 포함한다(CLAUDE.md 구조 규칙). 루트에서 `pnpm -r typecheck`/`pnpm --filter <pkg> ...`로 다룬다.

### 기술 스택
- 프레임워크/빌드: Astro(`output: 'static'`, Vite 기반) + TypeScript + React(`@astrojs/react`) islands.
- 스타일: Tailwind CSS v4(`@tailwindcss/vite`).
- EXIF: `exifr`. 봇 방지: Cloudflare Turnstile 위젯.
- 패키지 매니저: pnpm (workspace).

## 5. 설계 개요

### 디렉터리

```
apps/web/
  src/
    pages/
      index.astro       # 제보 폼 페이지 (현재 유일 라우트). ReportForm을 client:load
      404.astro         # → dist/404.html (GitHub Pages 자동 인식)
    components/
      ReportForm.tsx    # 제보 폼 React island (인터랙션 담당)
    layouts/Base.astro  # 문서 셸 (html/head/body), global.css import
    styles/global.css   # @import "tailwindcss";
    lib/api.ts          # intake-api 클라이언트 (submissions / finalize)
    lib/exif.ts         # exifr 래퍼
    lib/turnstile.ts    # 위젯 로드/토큰 획득
  astro.config.ts       # react() + base=PUBLIC_BASE_PATH, vite.plugins=[tailwindcss()]
```

### 제출 흐름 (클라이언트)

```
폼 작성 + 이미지 선택
  → exifr로 EXIF 추출, 첨부 목록(filename/mime/size[/추정 sha256]) 구성
  → Turnstile 토큰 획득
  → (1) POST {API}/submissions  { 메타 + attachments + turnstile_token }
        ← { submission_id, finalize_token, uploads:[{ staging_key, put_url }] }
  → (2) 각 첨부 PUT put_url  (R2 직접 업로드)
  → (3) POST {API}/submissions/{submission_id}/finalize  { finalize_token }
        ← { issue_url, attachments:[{ r2_key, sha256, ... }] }
  → 결과 화면에 issue_url + 첨부 표시
```

### 빌드/배포

- 공통: `astro build` → `dist/`에 라우트별 정적 HTML(제보 폼 `index.html`, `404.html`) 생성. 콘텐츠는 zero-JS, 제보 폼 island JS만 포함. base는 `PUBLIC_BASE_PATH`.
- GitHub Pages: `PUBLIC_BASE_PATH=/<repo>/ astro build`. `dist/404.html`을 GitHub Pages가 자동 인식. (커스텀 도메인이면 `/`.)
- Cloudflare Pages: `PUBLIC_BASE_PATH=/ astro build`. 출력 디렉터리 `dist`를 그대로 서빙.

## 6. 완료 조건 (Acceptance Criteria)

- [x] `apps/web/`가 pnpm workspace에 포함되고 루트에서 `pnpm --filter votatis-web dev`로 Astro dev 서버가 뜬다. (확인: dev 서버 기동, 기본 포트 5173 — intake-api `ALLOWED_ORIGIN`과 정합)
- [x] 제보 폼이 PRD §8 필드(선거·제목·요약·내용·지역·발생일시·출처 URL/텍스트·태그·첨부)를 입력받는다. (확인: 브라우저 스냅샷에 전 필드 렌더. 개표단위는 불필요 데이터로 제거(0001/0003 changelog), 지역은 주소 자동완성으로 입력)
- [x] 출처(url/text)도 첨부도 없으면 클라에서 제출이 막힌다. (확인: 근거 없을 때 제출 버튼 disabled + 안내문 표시)
- [~] 이미지 첨부 선택 시 `exifr`로 EXIF가 추출되어 제출 메타에 포함된다. — `lib/exif.ts`로 추출해 `exif`로 전송하는 코드 구현. 라이브 첨부 업로드는 presigned PUT이 실제 R2(cloudflarestorage.com)를 가리켜 로컬에서 회피(steering `intake-api-local-flow-test` 지침), 텍스트 출처만으로 전 흐름 검증. 첨부 경로 라이브 확인은 미수행.
- [x] Turnstile 위젯에서 토큰을 받아 `POST /submissions`에 실어 보낸다. (확인: 테스트 sitekey `1x00…AA`로 토큰 발급 → 제출 버튼 활성화 → 서버 통과)
- [x] 전 흐름(`/submissions` → `/finalize`)이 로컬 intake-api(`wrangler dev`, `SIMULATE_GITHUB=true`)를 상대로 끝까지 성공하고, 결과 화면에 `issue_url`이 표시된다. (확인: 브라우저에서 제출 → `issue_url` `/simulate/issues/2` 표시, Issue 본문에 election/title/source/익명 submitter 정합)
- [x] Turnstile 403 / rate limit 429 / 파일 검증 400 등 실패가 사용자에게 구분되어 안내된다. (`errorMessageFor`에서 status별 분기 구현 — 403 재인증 안내, 429 rate limit, 400 서버 메시지. 각 status 라이브 트리거는 미수행)
- [x] `astro build` 산출물 `dist/`에 라우트별 정적 HTML(`index.html`, `404.html`)이 생성되고, 제보 폼만 island JS를 싣는다. (확인: 404.html script 0개=zero-JS, ReportForm island JS는 별도 청크)
- [x] `PUBLIC_BASE_PATH=/`와 `PUBLIC_BASE_PATH=/<repo>/` 두 값으로 각각 빌드했을 때 자산·링크 경로가 base를 정확히 반영한다. (확인: `/_astro/…` vs `/votatis/_astro/…`)
- [x] `dist/404.html`이 생성되어 GitHub Pages·Cloudflare Pages 양쪽에서 잘못된 경로가 처리되고, 정적 라우트 딥링크 새로고침이 그대로 동작한다. (확인: 404.astro → dist/404.html 생성)
- [x] `PUBLIC_API_BASE_URL`로 API 엔드포인트가 주입되어 로컬/운영 전환이 코드 수정 없이 된다. (확인: dev 시 `http://localhost:8787` 주입, 상대 issue_url을 base로 보정)
- [x] 루트 `pnpm -r typecheck`가 통과한다. (확인: intake-api `tsc` + web `astro check` 모두 0 errors)

## 7. 미해결 질문 / 리스크

- **배포 도메인 미정** — 도메인이 정해지면 `0001`/`docs/intake-api.md §6` 체크리스트대로 intake-api `ALLOWED_ORIGIN`, R2 CORS(`r2-cors.json`), Turnstile 위젯 `domains`를 그 도메인으로 갱신해야 한다. 미정인 동안은 로컬(`http://localhost:5173`)로만 검증.
- **GitHub Pages base path** — 프로젝트 페이지(`user.github.io/<repo>/`)인지 커스텀 도메인(루트)인지에 따라 `PUBLIC_BASE_PATH`가 달라진다. 기본값은 `/`(Cloudflare Pages·커스텀 도메인)로 두고 구현했고, GitHub Pages 프로젝트 페이지면 빌드 시 `/<repo>/`를 주입한다. 어느 호스트로 갈지는 여전히 미정.
- **클라 추정 sha256 전송 여부** — 결정: **생략**. `0001`이 서버 계산값을 정본으로 쓰므로 클라는 sha256을 보내지 않는다(구현 반영).
- **로컬 dev 포트** — web dev 서버를 `5173`으로 고정(`astro dev --port 5173`)해 intake-api `ALLOWED_ORIGIN`(http://localhost:5173)과 정합. 포트가 점유되면 Astro가 다른 포트로 폴백하므로, 그때는 intake-api `ALLOWED_ORIGIN`을 그 포트로 맞춰야 CORS가 통과한다.
- **첨부 타입/크기 상한** — `0001`의 허용 MIME·크기 상한과 폼의 `accept`/클라 검증을 맞춰야 함(서버 값 확인 후 반영).
- **EXIF 개인정보** — GPS 등 민감 EXIF를 그대로 전송할지, 마스킹/선택 전송할지(PRD 원칙6 최소 노출과 연관). 임시 단계에선 전송하되 추후 정책화.
- **자유 입력 지역의 구조화** — 주소 자동완성에서 후보를 고르지 않고 자유 입력한 경우, 현재는 입력 텍스트를 `region.sido`에 통째로 담는다(분해 불가에 대한 임시 처리). API의 region 스키마에 자유 텍스트 필드가 없어서인데, 검토 시 별도 필드 추가 또는 다른 보관 위치를 정할 수 있다.

## Changelog
기능/기술이 크게 바뀐 변경만 한 줄씩. 단순 버그·오타·리팩터링은 제외.
- 2026-06-09: 최초 작성
- 2026-06-10: 빌드 프레임워크를 React Router v7(SSG)에서 Astro islands(`output: 'static'` + React island)로 변경 — 콘텐츠 zero-JS·성능, SPA 미사용. base/API 주입 변수도 `PUBLIC_BASE_PATH`/`PUBLIC_API_BASE_URL`로 정정. (요청: 채팅)
- 2026-06-10: 스타일링을 vanilla-extract에서 Tailwind CSS v4(`@tailwindcss/vite`)로 변경 — Astro 최다 사용·`.astro`/React island 클래스 공유·설정 최소. (요청: 채팅)
- 2026-06-10: `apps/web` 구현 — Astro(static) + React island(`ReportForm`) + Tailwind v4 제보 폼, 2단계 업로드 오케스트레이션(`lib/api.ts`), exifr·Turnstile 통합. 결정: 클라 sha256 생략, `PUBLIC_BASE_PATH` 기본 `/`, dev 포트 5173 고정. 로컬 intake-api(SIMULATE_GITHUB) 상대 전 흐름 브라우저 검증 완료. (요청: 채팅)
- 2026-06-10: 선거 종류 select를 고정 목록에서 최근 선거 5개(본투표일 내림차순)로 교체하고 옵션에 "(본투표일 YYYY.MM.DD)" 표기. API로 보내는 election 값은 선거명만 유지. (요청: 채팅)
- 2026-06-10: 지역 입력을 시도/시군구 2개 input에서 단일 주소 검색 input(`RegionAutocomplete`)으로 교체. `src/data/regions.flat.json`(법정동, 5316건)을 첫 포커스 때 dynamic import(별도 청크 ~51KB gzip)로 지연 로드, fuzzy(부분문자열+subsequence) 매칭 후보 드롭다운. 선택 시 sido/sigungu/eup_myeon_dong 구조화, 매칭 없으면 입력 텍스트를 coarse 라벨로 `region.sido`에 담아 자유 입력 허용. (요청: 채팅)
- 2026-06-10: 주소 자동완성 UX 보강 — 입력 시 첫 후보 기본 하이라이트, ↑/↓ 이동, Enter로 (화살표 선택 없으면) 맨 위 후보 확정. 한글 IME 조합 중 Enter는 무시(`isComposing`)해 글자 겹침 방지. 선거 목록에 제21대 국회의원선거(2020.04.15) 추가. (요청: 채팅)
- 2026-06-10: 폼·payload에서 `counting_unit`(개표 단위) 제거 — intake-api 스키마 제거(스펙 0001)와 정합. (요청: 채팅)
