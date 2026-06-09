---
tldr: 스펙 스킬(spec-create/spec-implement/spec-review)의 워크플로우 규칙은 steering에 두지 말고 해당 SKILL.md 본문에 직접 녹인다.
tags: [convention, workflow, spec, steering]
last_retrieved: 2026-06-10
retrieval_count: 2
---

## 규칙 / 교훈
스펙 주도 개발 워크플로우(spec-create / spec-implement / spec-review)에 관한 규칙·절차·체크리스트는
steering 항목으로 만들지 않는다. 대신 **해당 스킬의 `.claude/skills/<skill>/SKILL.md` 본문**에 직접 녹인다.

## 왜
- 스킬은 그 워크플로우를 실행할 때 항상 로드되므로, 규칙을 본문에 두면 회상 누락 없이 매번 적용된다.
- steering은 회상이 선택적이라, 스킬 실행 시점에 같은 규칙이 두 곳(steering + 스킬)에 흩어지면 중복·드리프트가 생긴다.
- 사용자가 명시적으로 요청: spec 관련 steering 항목을 스킬 본문으로 이관(spec-create-workflow.md → spec-create SKILL.md).

## 적용
- spec 워크플로우 관련 합의·교훈이 나오면 steering이 아니라 대상 SKILL.md의 "작업 순서"·"원칙" 등에 추가한다.
- steering에 이미 그런 항목이 있으면 스킬로 옮기고 steering에서는 삭제한다.
- spec과 무관한 인프라·테스트·언어 지식(예: pnpm, cloudflare 테스트 셋업, 모노레포 레이아웃)은 그대로 steering에 둔다.
