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
| [cloudflare-vitest-pool-workers-setup.md](cloudflare-vitest-pool-workers-setup.md) | Worker 테스트 셋업 3대 함정: nodejs_compat 플래그, isolatedStorage:false, pnpm onlyBuiltDependencies. | pitfall, cloudflare, testing, pnpm | 2026-06-09 | 0 |
| [monorepo-apps-layout.md](monorepo-apps-layout.md) | 코드는 apps/&lt;name&gt;/ 아래 pnpm workspace로. 루트는 specs/steering/docs/공통설정만. | convention, project, monorepo, pnpm | 2026-06-10 | 2 |
| [pnpm-filter-run-script.md](pnpm-filter-run-script.md) | package.json의 deploy 같은 스크립트는 `pnpm --filter <pkg> run deploy`로. run 없이 쓰면 pnpm 내장 deploy와 충돌. | pitfall, pnpm, monorepo | 2026-06-10 | 3 |
| [korea-region-dataset.md](korea-region-dataset.md) | 전국 행정구역 데이터. "내손1동"처럼 분동·생활 단위가 필요하면 행정동, "리"가 필요하면 법정동. 행정동은 juso administrationCode.tsv(행안부 기준 매일 갱신, 키 불필요)로 만들고 출장소 제외·세종 단층·전북 명칭만 보정. | reference, data, korea-region | 2026-06-10 | 1 |
| [intake-api-local-flow-test.md](intake-api-local-flow-test.md) | intake-api 로컬 wrangler dev 라이브 테스트: --var로 SIMULATE_GITHUB·turnstile 테스트키 주입 + 첨부 없이 텍스트 출처만 제출로 presigned R2 PUT 회피. 첨부 흐름은 --remote(+KV preview_id·R2 preview_bucket_name 프로덕션 재사용) 필요. | pitfall, testing, cloudflare, intake-api | 2026-06-10 | 6 |
| [spec-workflow-rules-go-in-skill.md](spec-workflow-rules-go-in-skill.md) | 스펙 스킬(spec-create/implement/review)의 워크플로우 규칙은 steering이 아니라 해당 SKILL.md 본문에 둔다. | convention, workflow, spec, steering | 2026-06-10 | 1 |
| [web-dev-port-cors.md](web-dev-port-cors.md) | apps/web(Astro) dev는 포트 5173으로(기본 4321). intake-api ALLOWED_ORIGIN=localhost:5173과 정합해야 CORS 통과. 폴백 시 --var ALLOWED_ORIGIN으로 맞춰라. | pitfall, cors, web, intake-api | 2026-06-10 | 2 |
| [react19-event-type-deprecated-hint.md](react19-event-type-deprecated-hint.md) | @types/react 19에서 React.FormEvent·FormEventHandler가 @deprecated → astro check ts(6385) hint. 핸들러는 타입 주석 없이 JSX prop 인라인 (e)=>로 추론시켜 회피. | pitfall, react, typescript, astro | 2026-06-10 | 2 |
| [react-ime-composing-enter.md](react-ime-composing-enter.md) | React 입력에서 한글 IME 조합 중 Enter는 조합 확정용 → onKeyDown 맨 앞 ev.nativeEvent.isComposing이면 return. 안 하면 자동완성 선택과 충돌해 "내손2동동"처럼 글자 겹침. | pitfall, react, korean, ime | 2026-06-10 | 0 |
| [tailwind-variant-precedence.md](tailwind-variant-precedence.md) | Tailwind에서 같은 속성 유틸(bg-white vs bg-gray-100)을 className에 같이 넣으면 문자열 순서 무관, CSS source order가 이김. 조건부 상태 배경은 disabled:/hover: 변이로 specificity↑시켜 base를 이기게. | pitfall, tailwind, css, web | 2026-06-10 | 0 |
