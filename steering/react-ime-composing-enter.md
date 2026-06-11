---
tldr: React 입력에서 한글(IME) 조합 중 Enter는 "조합 확정"용이라 키 핸들러가 같이 발동하면 자동완성 선택과 커밋이 충돌해 "내손2동동"처럼 글자가 겹친다. onKeyDown 맨 앞에서 ev.nativeEvent.isComposing이면 return 한다.
tags: [pitfall, react, korean, ime]
last_retrieved: 2026-06-10
retrieval_count: 1
---

## 규칙 / 교훈
자동완성·검색 input 등에서 Enter 키로 동작(후보 선택 등)을 처리할 때, 한글 등 IME 조합 중 눌린 Enter는 무시해야 한다. onKeyDown 핸들러 첫 줄:

```tsx
function onKeyDown(ev: React.KeyboardEvent<HTMLInputElement>) {
  if (ev.nativeEvent.isComposing) return; // IME 조합 중 Enter는 "조합 확정"용 — 무시
  // ... ArrowDown/Up/Enter/Escape 처리
}
```

## 왜
한글 입력 시 마지막 글자를 확정하는 Enter와, 핸들러가 처리하려는 Enter가 같은 keydown으로 들어온다. 가드 없이 처리하면: 후보를 pick 해서 input 값을 라벨로 setState 하는 동시에 IME가 조합 중이던 글자를 input 에 커밋 → "내손2동" + "동" = "내손2동동" 처럼 겹친다. `isComposing`이 true인 keydown을 건너뛰면, 첫 Enter는 조합만 확정하고 한 번 더 누른 Enter가 실제 동작을 한다(표준 한글 입력 UX).

## 적용
- Enter 뿐 아니라 ArrowUp/Down 등도 조합 중엔 무시하는 게 안전하므로 가드는 분기 이전 맨 앞에 둔다.
- 영문/숫자만 다루는 입력엔 영향이 없으니 자동완성·콤보박스엔 기본으로 넣는다.
- 관련: [[react19-event-type-deprecated-hint]], [[web-dev-port-cors]]
