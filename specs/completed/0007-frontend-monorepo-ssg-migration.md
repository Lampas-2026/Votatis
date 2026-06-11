---
id: "0007"
title: frontend(Next.js)를 apps/frontend로 통합 + 제보 기능 이식 + SSG, apps/web 폐기
status: completed   # not-started | in-progress | in-review | completed
created: 2026-06-10
updated: 2026-06-10
related:
  - "specs/completed/0006-d1-report-store-api.md (intake API 계약: 2단계 업로드/report_id)"
  - "specs/completed/0004-report-flow-wizard.md (apps/web 제보 마법사)"
  - "specs/completed/0005-landing-page.md (apps/web 랜딩 — 폐기 대상)"
  - "steering/monorepo-apps-layout.md / korea-region-dataset.md / react-ime-composing-enter.md / web-dev-port-cors.md"
  - "https://nextjs.org/docs/pages/guides/static-exports"
  - "https://nextjs.org/docs/messages/export-image-api"
  - "https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/"
  - "https://pnpm.io/workspaces"
  - "https://openapi-ts.dev/ (openapi-typescript + openapi-fetch)"
---

# frontend(Next.js)를 apps/frontend로 통합 + 제보 기능 이식 + SSG, apps/web 폐기

## 1. 배경 / 문제

upstream 머지로 루트에 `frontend/`(Next.js 16 + React 19 + Tailwind 4)가 들어왔다. 풍부한 UI(랜딩·archive·search·stats·report·admin)를 갖췄지만 **제보(report) 화면은 목업**이다(`frontend/src/app/report/ReportFlow.tsx`의 `TODO: POST /api/reports`). 한편 `apps/web`(Astro+React)은 **실제 동작하는 제보 제출 파이프라인**을 갖고 있다(주소 자동완성·이미지 업로드·EXIF·2단계 presigned 업로드→finalize).

또한 `frontend/`는 **루트에 위치**(CLAUDE.md 모노레포 규칙 `apps/<name>/` 위반)하고 **npm(`package-lock.json`)** 을 써서 pnpm 워크스페이스 밖이다.

이 스펙은: ①`frontend/`를 `apps/frontend/`로 옮겨 pnpm 모노레포에 정식 편입, ②`apps/web`의 제보 제출 파이프라인을 frontend의 report UI로 이식, ③정적(SSG) 빌드로 Cloudflare Pages 배포, ④전부 검증되면 `apps/web` 폐기.

## 2. 목표 (Goals)

1. `frontend/` → `apps/frontend/` 이동, pnpm 워크스페이스 편입(`package-lock.json` 제거, 루트 단일 `pnpm-lock.yaml`). Next 16/React 19/Tailwind 4 유지.
2. `apps/web`의 **제보 제출 기능을 frontend의 report UI(ReportFlow)에 이식** — 주소 자동완성, 이미지 업로드, API 연동+submit, 체크박스→input 비활성.
3. **UI는 frontend 것을 사용**. 제출에 필요하나 frontend에 없는 조각만 web에서 가져온다. **홈/랜딩은 frontend 것**(apps/web 홈은 이식 없이 폐기).
4. `output: 'export'`(+`images.unoptimized`) **정적 빌드** → `out/`. **Cloudflare Pages**(기존 `votatis-web.pages.dev` 대체) 배포.
5. 전부 검증되면 **`apps/web` 삭제** + 관련 참조(intake-api `ALLOWED_ORIGIN`, R2 CORS, docs, 워크스페이스) 정리.

## 3. 비목표 (Non-Goals)

- 검수(verification) 기능 — 별도 스펙.
- frontend 기존 페이지(archive/search/stats/admin) **재설계/실 API 연동** — 이번은 그대로 이동만 하고 SSG 호환 점검까지. 목록/검색을 `GET /reports`에 실제로 붙이는 것은 별도(현 목업 유지).
- intake-api 백엔드 동작 변경 — `ALLOWED_ORIGIN` 정합 외 무변경(2단계 업로드·`report_id` 계약 그대로).
- next/image 서버 최적화 — SSG라 `unoptimized` 사용.

## 4. 요구사항

### 기능
1. **이동/워크스페이스**: `git mv frontend apps/frontend`(히스토리 보존), `package-lock.json` 삭제. package.json `name`을 `votatis-frontend`로(워크스페이스 식별). `apps/*` glob으로 자동 편입 → `pnpm --filter votatis-frontend <script>` 동작. scripts: `dev`/`build`/`typecheck`/`lint` 정합(typecheck는 `tsc --noEmit` 또는 `next build` 타입체크).
2. **SSG**: `next.config.ts`에 `output: 'export'` + `images: { unoptimized: true }`. `pnpm --filter votatis-frontend build` → `apps/frontend/out/` 정적 산출. 서버 전용 기능(Route Handler/Server Action/요청시 데이터 fetch)이 없어야 export 성공.
3. **제보 제출 이식**(ReportFlow의 목업 TODO 대체):
   - **주소 자동완성**: `RegionAutocomplete` + `regions.flat.json`/`regions.nested.json`(행정동 데이터) + 한글 IME 조합 처리(onKeyDown `isComposing` 가드).
   - **이미지 업로드**: 드래그&드롭 첨부 + `lib/image`(전처리) + `lib/exif`(클라 EXIF 추출, 메타만 전송).
   - **API 연동+submit**: intake-api 호출은 **생성된 OpenAPI 타입 클라이언트**를 사용한다(아래 §4-7, 손으로 타입을 적던 `apps/web`의 `lib/api`를 그대로 옮기지 않는다). 흐름은 동일: POST `/submissions` → presigned PUT → POST `/submissions/{id}/finalize`(응답 `report_id`). presigned PUT(R2 직접 업로드)은 OpenAPI 스펙 밖이라 클라 내 별도 fetch 유지. `lib/turnstile`(위젯/토큰)은 그대로 이식. 제출 성공 시 frontend UI로 접수번호(`report_id`) 표시.
7. **OpenAPI 타입 클라이언트(타입 동기화)**: intake-api의 OpenAPI 스펙을 source of truth로 타입이 자동 동기화되는 클라이언트를 둔다.
   - intake-api가 `openapi.json`을 **파일로 방출**(커밋)하는 스크립트 추가(`@hono/zod-openapi` 앱에서 스펙 직렬화). 워커를 띄우지 않고도 생성 가능하게.
   - `apps/frontend`에서 **`openapi-typescript`로 타입 생성** + **`openapi-fetch`로 타입 세이프 클라이언트** 구성. 생성물(`*.d.ts`)은 커밋.
   - `generate`(스펙→타입) + `check`(재생성 후 diff 나면 실패) 스크립트. 스펙(Zod)이 바뀌면 타입이 갈리는 걸 CI/검증에서 잡는다.
   - **체크박스→비활성**: `locationIndependent` 체크 시 지역 입력 `disabled`, `consent`(익명 제보·공개 동의) 미동의 시 제출 불가.
4. **CORS/포트 정합**: Next dev 기본 포트(3000) 기준으로 intake-api `ALLOWED_ORIGIN`에 로컬(`http://localhost:3000`)+배포 도메인 반영. R2 CORS(`r2-cors.json`)도 동일.
5. **홈/랜딩**: frontend 랜딩을 홈으로 사용. apps/web의 `index.astro`/홈은 이식하지 않고 폐기.
6. **폐기(최종)**: 위 항목 검증 후 `apps/web/` 삭제 + 워크스페이스/문서/CORS에서 web(`votatis-web`, `localhost:5173`) 참조 제거.

### 비기능
7. **pnpm 전용**(`package-lock.json` 금지), 모노레포 규칙(`apps/<name>/`) 준수.
8. `pnpm -r typecheck`(또는 frontend lint/build 타입체크) 통과, SSG 빌드 성공.
9. intake-api 계약 그대로 사용(백엔드 무변경). 환경변수는 Astro `import.meta.env.PUBLIC_*` → Next `NEXT_PUBLIC_*`로 치환.

## 5. 설계 개요

### 이동 & 빌드
- `git mv frontend apps/frontend` → `package-lock.json` 삭제 → `pnpm install`(루트 lock 편입). `name: "votatis-frontend"`.
- `next.config.ts`: `{ output: "export", images: { unoptimized: true } }`.
- Cloudflare Pages: 빌드 산출 디렉터리 `apps/frontend/out`, 빌드 커맨드 pnpm 기반. 프로젝트는 기존 `votatis-web`(Astro)에서 Next static으로 전환(또는 신규 프로젝트).

### 이식 매핑 (apps/web → apps/frontend)
| from | to | 비고 |
|------|----|------|
| `src/components/RegionAutocomplete.tsx` | `src/components/RegionAutocomplete.tsx` | `"use client"`, IME 가드 유지 |
| `src/data/regions.flat.json` / `regions.nested.json` | `src/data/` | 행정동 데이터 |
| `src/lib/{exif,image,turnstile}.ts` | `src/lib/` | EXIF·이미지 전처리·Turnstile |
| ~~`src/lib/api.ts`~~ | (이식 안 함) | **생성형 OpenAPI 클라이언트로 대체**(§4-7) |
| `ReportWizard.tsx`의 제출 로직 | `app/report/ReportFlow.tsx`에 통합 | UI는 frontend, 로직만 이식 |

### OpenAPI 타입 클라이언트 (타입 동기화)
- 도구: **`openapi-typescript`**(스펙→TS 타입) + **`openapi-fetch`**(타입 세이프 fetch). 경량·SSG/엣지 친화적, 런타임 의존 최소.
- source of truth: intake-api의 OpenAPI 스펙(`@hono/zod-openapi`가 Zod에서 생성). intake-api에 `openapi.json`을 파일로 쓰는 스크립트(`pnpm --filter votatis-intake-api openapi:emit` 류)를 두어 커밋.
- `apps/frontend`: `openapi-typescript`가 `apps/intake-api/openapi.json`(또는 워크스페이스 참조)에서 `src/lib/api/schema.d.ts` 생성 → `openapi-fetch`로 `createClient<paths>({ baseUrl })`. 제출/조회 호출이 경로·바디·응답까지 타입체크된다.
- 동기화 보장: `generate`+`check` 스크립트. 스펙 변경 시 재생성 diff로 감지(미재생성이면 check 실패). presigned PUT만 스펙 밖이라 별도 fetch.

- ReportFlow의 `TODO` 제출부 → `lib/api` 호출 흐름으로 교체. consent/locationIndependent 상태와 disabled 연결.
- 환경변수: API base URL·Turnstile sitekey 등 `NEXT_PUBLIC_*`로.

### SSG 제약 점검
- `"use client"` 페이지(report/archive/search/admin)는 정적 export와 호환(런타임 서버 불필요). 단 **Route Handler·Server Action·요청시 서버 fetch가 있으면 export 실패** → 점검·제거.
- `next/image`는 `unoptimized`로 정적 `<img>` 출력.

## 6. 완료 조건 (Acceptance Criteria)

- [x] `frontend/`가 `apps/frontend/`로 이동(`git mv`)되고 `package-lock.json`이 제거됐다. `pnpm --filter votatis-frontend dev/build` 동작, 루트 `pnpm-lock.yaml`에 편입(`name: votatis-frontend`).
- [x] `next.config`에 `output:'export'`+`images.unoptimized` 적용, `pnpm --filter votatis-frontend build` 성공 → `apps/frontend/out/`(36/36 정적 페이지). 동적 라우트(archive/evidence)는 SSG 호환 처리(generateStaticParams+dynamicParams=false).
- [x] report 화면 실제 제출 동작 — **Playwright E2E로 검증**: 카테고리/유형·RegionAutocomplete·출처·동의·Turnstile(테스트키 자동통과) → 제출 → "접수번호 {report_id}" 표시(intake `dev:local` D1 적재). 첨부+EXIF 경로는 로컬 shim curl로 별도 확인.
- [x] intake-api 호출이 **생성된 OpenAPI 클라이언트**(`openapi-typescript`+`openapi-fetch`, `src/lib/api/{schema.d.ts,client.ts}`)로 이뤄지고 경로/바디/응답 타입체크(손으로 적은 API 타입 없음).
- [x] 타입 동기화: intake-api `openapi:emit`→`openapi.json`, frontend `openapi:gen`/`openapi:check`(재생성 diff 시 실패). check 통과(diff 0) 확인.
- [x] `locationIndependent` 체크 시 지역 입력 비활성(`RegionAutocomplete disabled`), `consent` 미동의/토큰 없음/근거 없음 시 제출 버튼 비활성(`s3Valid`).
- [x] frontend 랜딩이 홈(`/`), apps/web 홈은 삭제됨.
- [x] intake-api `ALLOWED_ORIGIN`(`localhost:3000`+`votatis-web.pages.dev`)·R2 CORS가 frontend 오리진과 정합 — CORS preflight 204 + 제출 통과 확인.
- [x] `pnpm -r typecheck` 통과, frontend가 워크스페이스로 인식, intake-api 테스트 23건 통과.
- [x] (최종) `apps/web/` 삭제 + wrangler.jsonc/r2-cors.json/docs에서 web(`localhost:5173`) 참조 제거. 제보 흐름 회귀 없음(E2E 통과).

## 7. 미해결 질문 / 리스크

- **admin/free 페이지 SSG 적합성**: `free/admin`(login/queue)이 서버 의존(인증·route handler)이면 정적 export가 실패한다. 점검 후 정적 호환화하거나 범위에서 분리.
- **Cloudflare Pages 프로젝트 전환**: 기존 `votatis-web`(Astro) 빌드 설정을 Next static(output dir `out`, pnpm 빌드)으로 바꿔야 한다. 신규 프로젝트로 갈지 결정 필요.
- **포트/도메인 변경**: Next dev 기본 3000(기존 web 5173) — CORS·문서·steering(`web-dev-port-cors`) 갱신 필요.
- **Astro→Next 이식 차이**: 환경변수(`import.meta.env`→`NEXT_PUBLIC_*`), 하이드레이션/클라 전용 처리, Tailwind 설정 차이.
- **archive/search 실 API 연동**은 이 스펙 밖(목업 유지) — 합의됨.
- **apps/web 삭제 타이밍**: frontend 제보 흐름이 완전 검증된 뒤에만.

## Changelog
기능/기술이 크게 바뀐 변경만 한 줄씩. 단순 버그·오타·리팩터링은 제외.
- 2026-06-10: 최초 작성
- 2026-06-10: API 연동을 손으로 적던 lib/api 이식 대신 **생성형 OpenAPI 클라이언트**(intake-api openapi.json 방출 → openapi-typescript 타입 + openapi-fetch, generate/check로 타입 동기화)로 명시. (요청: 채팅)
- 2026-06-10: 구현 완료 — frontend→apps/frontend(pnpm), SSG(output:export), 제보 파이프라인 이식(RegionAutocomplete+행정동 데이터·EXIF/이미지·Turnstile·2단계 업로드·체크박스/consent), OpenAPI 타입 클라(emit/gen/check), CORS 3000 정합, apps/web 삭제. upstream 누락 `src/lib/types.ts` 재구성(카테고리/유형 분류 — 추후 실제 분류로 교체 가능). Playwright E2E로 제출→report_id 검증. typecheck/test(23)/SSG(36)/타입동기화 통과. in-review 이동.
