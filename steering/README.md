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
| [monorepo-apps-layout.md](monorepo-apps-layout.md) | 코드는 apps/&lt;name&gt;/ 아래 pnpm workspace로. 루트는 specs/steering/docs/공통설정만. | convention, project, monorepo, pnpm | 2026-06-09 | 0 |
| [pnpm-filter-run-script.md](pnpm-filter-run-script.md) | package.json의 deploy 같은 스크립트는 `pnpm --filter <pkg> run deploy`로. run 없이 쓰면 pnpm 내장 deploy와 충돌. | pitfall, pnpm, monorepo | 2026-06-09 | 2 |
| [intake-api-local-flow-test.md](intake-api-local-flow-test.md) | intake-api 로컬 wrangler dev 라이브 테스트: --var로 SIMULATE_GITHUB·turnstile 테스트키 주입 + 첨부 없이 텍스트 출처만 제출로 presigned R2 PUT 회피. | pitfall, testing, cloudflare, intake-api | 2026-06-09 | 1 |
