# CLAUDE.md

## 프로젝트 구조 (모노레포)

- 코드(앱·서비스·패키지)는 `apps/<name>/` 아래에 둔다. pnpm workspace(`pnpm-workspace.yaml`의 `apps/*`)로 묶는다. 예: `apps/intake-api/`(제보 수집 Worker).
- 루트에는 공통만 둔다: `specs/`, `steering/`, `docs/`, `.claude/`, 워크스페이스 설정(루트 `package.json`, `pnpm-workspace.yaml`, 단일 `pnpm-lock.yaml`).
- 새 앱/서비스는 루트가 아니라 새 디렉터리 `apps/<name>/`로 추가한다.
- 루트에서 `pnpm -r test` / `pnpm -r typecheck`로 전체를, `pnpm --filter <pkg> ...`로 개별 패키지를 다룬다.

## Steering — 프로젝트 지식 저장소 (필수 정책)

`steering/`는 작업하면서 쌓인 규칙과 반복하면 안 되는 실수를 누적하는 디렉터리다.
운영 규칙 전문은 `steering/README.md`에 있다. 핵심 동작:

1. **세션 시작 시 회상**: 작업을 시작하기 전 `steering/README.md` 인덱스를 훑어, 지금 작업과 관련된 항목이 있으면 해당 파일을 읽고 따른다.
2. **자동 캡처**: 대화 중 ①합의된 규칙/컨벤션 ②저지른 실수와 회피법 ③비자명한 결정의 이유가 나오면, `steering/<kebab-case>.md`로 저장한다(frontmatter: `tldr`, `tags`, `last_retrieved`, `retrieval_count`). 단, 코드·git·PRD로 알 수 있는 사실이나 일회성 정보는 저장하지 않는다.
3. **회수 통계 갱신**: 어떤 steering 항목을 실제 참조·적용했다면 그 파일의 `retrieval_count`를 +1, `last_retrieved`를 오늘 날짜로 갱신하고, `steering/README.md` 인덱스의 해당 행도 동기화한다.
4. **인덱스 일관성**: steering 파일을 추가/수정/삭제하면 `steering/README.md`의 인덱스 표를 즉시 맞춘다.

## 스펙 주도 개발

기능 작업은 `specs/`의 스펙으로 관리한다. 상태별 디렉터리(`not-started` / `in-progress` / `completed`)로 분류하며 상태 전환은 파일 이동으로 표현한다. 전체 목록은 `specs/README.md` 인덱스에서 관리하며, 스펙을 추가·이동·삭제하면 인덱스를 즉시 동기화한다. 스킬: `spec-create`, `spec-implement`, `spec-review`.

### 스펙 Changelog (필수 정책)

채팅을 통해 특정 수정사항을 요구받아 작업했을 때, **그 변경이 어떤 스펙에 해당하는지 찾아 해당 스펙 파일의 `## Changelog` 섹션에 한 줄 기록**한다.

- **기록 대상**: 기능 동작이 바뀌거나(추가/변경/제거), 기술·구조가 크게 바뀐 경우(스택 교체, 아키텍처 변경, 데이터 스키마 변경 등).
- **기록 안 함**: 단순 버그 수정, 오타·문구 수정, 리팩터링처럼 동작이 그대로인 변경.
- **위치 결정**: `specs/{in-progress,completed,not-started}`에서 변경과 가장 관련된 스펙을 찾는다. 마땅한 스펙이 없으면 사용자에게 "관련 스펙이 없는데 새로 만들지" 물어보고, 임의로 만들지 않는다.
- **형식**: `- YYYY-MM-DD: <무엇이 어떻게 바뀌었나> (요청: 채팅)` 한 줄. frontmatter의 `updated`도 함께 갱신한다.
