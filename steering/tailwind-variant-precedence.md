---
tldr: Tailwind에서 같은 CSS 속성 유틸 둘(예: bg-white와 bg-gray-100)을 className에 같이 넣으면 어느 쪽이 이길지는 className 문자열 순서가 아니라 생성된 CSS의 source order/specificity가 정한다. 조건부 override(특히 disabled/hover 상태 배경)는 `disabled:`/`hover:` 변이를 써서 `:pseudo`로 specificity를 올려 base 유틸을 이기게 한다.
tags: [pitfall, tailwind, css, web]
last_retrieved: 2026-06-10
retrieval_count: 0
---

## 규칙 / 교훈
공유 `inputClass`에 `bg-white`가 들어 있는데, 비활성 시 회색 배경을 주려고 `className={`${base} ${disabled ? "bg-gray-100" : ""}`}` 처럼 **조건부로 덧붙이면 안 먹는다.** `bg-white`와 `bg-gray-100`은 같은 specificity(0,1,0)라 className 문자열 순서와 무관하게 **Tailwind가 생성한 CSS에서 더 나중에 정의된 규칙**이 이긴다(보통 base 유틸이 이겨 흰 배경 유지).

해결: 상태 스타일은 **변이(variant)** 로 준다.
```tsx
// ❌ 안 먹음 (bg-white 가 이김)
className={`${inputClass} ${disabled ? "bg-gray-100 text-gray-400" : ""}`}
// ✅ disabled: 변이 → `.disabled\:bg-gray-100:disabled` 는 :disabled pseudo 로 specificity(0,2,0) ↑
className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
```
입력의 `disabled` 속성이 켜지면 변이 규칙이 base `bg-white`를 이겨 회색 배경이 적용된다.

## 왜
Tailwind 유틸은 대부분 단일 클래스(0,1,0) specificity라, 같은 속성을 두 유틸로 지정하면 충돌은 cascade의 source order로 갈린다. JSX className의 토큰 순서는 cascade에 영향을 주지 않는다. `hover:`/`focus:`/`disabled:` 등 변이는 pseudo-class가 붙어 specificity가 한 단계 높아지므로 base 유틸을 안정적으로 덮는다.

## 적용
- 상태별(비활성·호버·포커스) 색/배경 override 는 항상 변이 유틸로 작성한다.
- 정말 base 유틸 자체를 바꿔야 하면 조건부로 **상충 유틸을 애초에 안 넣도록** className 을 분기한다(둘을 동시에 넣지 않기).
- 관련: [[react19-event-type-deprecated-hint]]
