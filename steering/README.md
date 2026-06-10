# Steering — 프로젝트 지식 저장소

작업을 하면서 발견한 **규칙**과 **반복하지 말아야 할 실수**를 한 파일에 하나씩 누적하는 곳.
대화 중에 자동으로 캡처되고, 회수(참조)될 때마다 통계가 갱신된다.

- 파일 한 개 = 규칙/교훈 한 건. `steering/<kebab-case>.md`.
- 이 README는 **인덱스**다. 아래 표가 항상 실제 파일 목록과 일치해야 한다.

## 운영 규칙

### 1. 언제 새 항목을 만드나 (캡처)
대화 중 아래에 해당하는 게 나오면 에이전트가 자동으로 steering 항목으로 저장한다.
- 지키기로 합의된 규칙/컨벤션 (코드 스타일, 워크플로우, 네이밍 등)
- 한 번 저지른 실수와 그 회피법 ("다음부터 X 하지 마라")
- 비자명한 결정과 그 이유 (코드/PRD만 봐선 알 수 없는 것)

저장 안 함: 코드·git·PRD를 보면 알 수 있는 사실, 이번 대화에서만 의미 있는 일회성 정보.

### 2. 파일 형식
각 파일은 frontmatter + 본문.

```markdown
---
tldr: 한두 문장 요약. 인덱스에 그대로 들어간다.
tags: [convention, pitfall]
last_retrieved: 2026-06-09   # 마지막으로 이 항목을 참조한 날
retrieval_count: 0           # 참조된 누적 횟수
---

## 규칙 / 교훈
무엇을. 본문.

## 왜
근거. 안 지키면 생기는 문제.

## 적용
구체적으로 어떻게 따르나.
```

### 3. 회수(retrieval) 통계
에이전트가 작업 중 어떤 steering 항목을 실제로 참조·적용했다면:
- 그 파일의 `retrieval_count`를 +1, `last_retrieved`를 오늘 날짜로 갱신
- 이 README의 해당 행도 같은 값으로 동기화

### 4. 인덱스 동기화
파일을 추가/수정/삭제하면 아래 표를 즉시 맞춘다. tldr·tags는 frontmatter와 일치시킨다.

## 인덱스

| 파일 | tldr | tags | 마지막 회수 | 회수 |
|------|------|------|------------|------|
| [cloudflare-vitest-pool-workers-setup.md](cloudflare-vitest-pool-workers-setup.md) | Worker 테스트 셋업 함정: nodejs_compat 플래그, isolatedStorage:false, pnpm onlyBuiltDependencies, D1은 readD1Migrations+applyD1Migrations로 스키마 주입. | pitfall, cloudflare, testing, pnpm, d1 | 2026-06-10 | 1 |
| [monorepo-apps-layout.md](monorepo-apps-layout.md) | 코드는 apps/&lt;name&gt;/ 아래 pnpm workspace로. 루트는 specs/steering/docs/공통설정만. | convention, project, monorepo, pnpm | 2026-06-10 | 4 |
| [pnpm-filter-run-script.md](pnpm-filter-run-script.md) | package.json의 deploy 같은 스크립트는 `pnpm --filter <pkg> run deploy`로. run 없이 쓰면 pnpm 내장 deploy와 충돌. | pitfall, pnpm, monorepo | 2026-06-10 | 3 |
| [korea-region-dataset.md](korea-region-dataset.md) | 전국 행정구역 데이터. "내손1동"처럼 분동·생활 단위가 필요하면 행정동, "리"가 필요하면 법정동. 행정동은 juso administrationCode.tsv로 만들고 출장소 제외·세종 단층·전북 명칭만 보정. 산출물은 apps/frontend/src/data/regions.*.json. | reference, data, korea-region | 2026-06-10 | 2 |
| [intake-api-local-flow-test.md](intake-api-local-flow-test.md) | intake-api 로컬 실행 두 모드: dev:local(LOCAL_UPLOAD shim, CF 없이 첨부까지) vs dev:remote(실 R2·D1). TURNSTILE 테스트키 + D1 db:migrate:local 선적용. 함정: wrangler dev는 .dev.vars/바인딩 변경 핫리로드 안 함 → 재시작 필수. | pitfall, testing, cloudflare, intake-api, d1 | 2026-06-10 | 9 |
| [spec-workflow-rules-go-in-skill.md](spec-workflow-rules-go-in-skill.md) | 스펙 스킬(spec-create/implement/review)의 워크플로우 규칙은 steering이 아니라 해당 SKILL.md 본문에 둔다. | convention, workflow, spec, steering | 2026-06-10 | 2 |
| [web-dev-port-cors.md](web-dev-port-cors.md) | apps/frontend(Next) dev 포트 3000과 intake-api ALLOWED_ORIGIN=localhost:3000이 일치해야 CORS 통과. 불일치면 "API는 200인데 브라우저만 실패". 폴백 시 --var ALLOWED_ORIGIN으로 맞춰라. (구 apps/web 5173은 0007에서 폐기) | pitfall, cors, frontend, intake-api | 2026-06-10 | 4 |
| [react19-event-type-deprecated-hint.md](react19-event-type-deprecated-hint.md) | @types/react 19에서 React.FormEvent·FormEventHandler가 @deprecated → astro check ts(6385) hint. 핸들러는 타입 주석 없이 JSX prop 인라인 (e)=>로 추론시켜 회피. | pitfall, react, typescript, astro | 2026-06-10 | 2 |
| [react-ime-composing-enter.md](react-ime-composing-enter.md) | React 입력에서 한글 IME 조합 중 Enter는 조합 확정용 → onKeyDown 맨 앞 ev.nativeEvent.isComposing이면 return. 안 하면 자동완성 선택과 충돌해 "내손2동동"처럼 글자 겹침. | pitfall, react, korean, ime | 2026-06-10 | 1 |
| [tailwind-variant-precedence.md](tailwind-variant-precedence.md) | Tailwind에서 같은 속성 유틸(bg-white vs bg-gray-100)을 className에 같이 넣으면 문자열 순서 무관, CSS source order가 이김. 조건부 상태 배경은 disabled:/hover: 변이로 specificity↑시켜 base를 이기게. | pitfall, tailwind, css, web | 2026-06-10 | 0 |
| [project-gh-account.md](project-gh-account.md) | fork 구조 — origin push는 3dulev/Votatis, PR은 업스트림 Lampas-2026/Votatis로(`--repo Lampas-2026/Votatis --head 3dulev:<branch>`). gh 쓰기 전 `gh api user`로 3dulev 확인. | convention, github, ops, project | 2026-06-10 | 2 |
| [gh-pr-edit-projectcards-bug.md](gh-pr-edit-projectcards-bug.md) | `gh pr edit`이 Projects classic deprecated GraphQL(projectCards) 오류로 실패하면, 본문 수정은 `gh api -X PATCH /repos/<o>/<r>/pulls/<n> --input <json>`으로 우회. | pitfall, github, gh-cli | 2026-06-10 | 0 |
| [drizzle-d1-schema-gotchas.md](drizzle-d1-schema-gotchas.md) | drizzle-orm 0.36(D1)에서 인덱스 extraConfig는 배열이 아니라 객체형 `(t)=>({...})`(배열형은 TS2769). 마이그레이션은 drizzle-kit generate→wrangler d1 migrations apply. | pitfall, drizzle, d1, cloudflare | 2026-06-10 | 0 |
| [gitignore-lib-catches-src-lib.md](gitignore-lib-catches-src-lib.md) | 루트 .gitignore(파이썬 템플릿)의 `lib/`가 apps/*/src/lib 소스까지 무시 → 새 앱 src/lib는 미추적되니 `!apps/<app>/src/lib/` 예외 추가. 머지한 upstream frontend도 src/lib 누락 피해(빌드 실패) 가능. | pitfall, git, gitignore, monorepo, web | 2026-06-10 | 1 |
| [nextjs-static-export-dynamic-routes.md](nextjs-static-export-dynamic-routes.md) | Next 16 output:export에서 동적 라우트 generateStaticParams는 빈 배열 불가(빌드 실패) → sentinel 1개+dynamicParams=false. 에러가 라우트 번갈아 뜨면 .next 캐시 의심. | pitfall, nextjs, ssg, frontend | 2026-06-10 | 0 |
| [frontend-pages-deploy.md](frontend-pages-deploy.md) | apps/frontend SSG→Cloudflare Pages 배포: NEXT_PUBLIC_* 빌드타임 주입, `wrangler pages deploy out --branch=main`(생략 시 preview), preview origin은 CORS 막힘, 실 Turnstile sitekey domains에 votatis-web.pages.dev 추가 필요. | pitfall, deploy, cloudflare-pages, frontend, cors | 2026-06-11 | 1 |
