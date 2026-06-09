---
name: spec-implement
description: specs/not-started/의 스펙을 in-progress로 옮겨 코드로 구현한다. 사용자가 "스펙 구현해줘", "이 스펙대로 만들어", "spec-implement", 특정 스펙 번호를 지목해 작업을 시작할 때 트리거한다.
---

# 스펙 구현하기 (spec-implement)

스펙을 받아 완료 조건을 충족하는 코드를 작성한다. 진행에 따라 스펙 파일을 디렉터리 간 이동시킨다.

## 상태 흐름

```
specs/not-started/<NNNN>-<slug>.md
   └─(구현 시작)→ specs/in-progress/<NNNN>-<slug>.md
        └─(구현·검증 완료)→ specs/in-review/<NNNN>-<slug>.md
             └─(검토 통과)→ specs/completed/<NNNN>-<slug>.md
```

파일을 이동할 때 frontmatter의 `status`와 `updated`, 그리고 `specs/README.md` 인덱스의 해당 행(상태·갱신일·파일 경로)도 함께 갱신한다.

## 작업 순서

1. **대상 스펙 확정** — 어떤 스펙인지 확정한다. 불명확하면 `specs/not-started/`, `specs/in-progress/`를 나열해 고르게 한다.
2. **스펙 정독** — 요구사항·설계 개요·완료 조건을 전부 읽는다.
3. **착수 표시** — `git mv`로 파일을 `specs/in-progress/`로 옮기고 `status: in-progress`, `updated`를 갱신한다.
4. **계획 수립** — 완료 조건(Acceptance Criteria) 각 항목을 작업 단위로 분해한다.
5. **구현** — 기존 코드 스타일·컨벤션을 따른다. 완료 조건을 하나씩 충족시킨다.
6. **검증** — 테스트/실행으로 동작을 확인하고 완료 조건 체크리스트를 채운다.
7. **in-review로 이동 후 spec-review 인계 (필수)** — 구현·검증이 끝나면 **스스로 `completed`로 옮기지 않는다.** `git mv`로 파일을 `specs/in-review/`로 옮기고 `status: in-review`, `updated`를 갱신한 뒤(`specs/README.md` 인덱스 행도 동기화), 곧바로 [[spec-review]] 스킬을 실행해 검토로 넘긴다. `completed`로의 이동은 spec-review가 통과 판정을 내릴 때만 일어난다.

## 원칙

- 스펙의 완료 조건이 곧 구현의 정의다. 임의로 범위를 넓히거나 줄이지 않는다.
- 스펙과 현실이 충돌하면 멈추고 사용자에게 알린 뒤 스펙을 갱신한다 — 코드만 몰래 다르게 만들지 않는다.
- 파일 이동은 가능하면 `git mv`로 해 히스토리를 보존한다.
