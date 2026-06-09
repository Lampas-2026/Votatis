---
tldr: @types/react 19에선 React.FormEvent·FormEventHandler 등 이벤트 타입 별칭이 @deprecated라 astro check가 ts(6385) hint를 낸다. 회피: 핸들러에 명시 타입 주석을 달지 말고 JSX 이벤트 prop에 인라인 (e)=>{...}로 써서 e 타입을 추론시킨다.
tags: [pitfall, react, typescript, astro]
last_retrieved: 2026-06-10
retrieval_count: 2
---

## 규칙 / 교훈
`apps/web`(React 19 island)에서 이벤트 핸들러를 쓸 때 `React.FormEvent<…>`나 `FormEventHandler<…>` 같은 타입 별칭을 직접 주석으로 달면 `astro check`(= 루트 `pnpm -r typecheck`)가 ts(6385) "'…' is deprecated" hint를 낸다. `@types/react` 19가 이 별칭들에 `@deprecated`를 달아둔 탓이다(에러·경고 아닌 hint라 빌드는 통과하지만 typecheck 출력이 지저분해진다).

회피: **핸들러에 명시 타입을 달지 않고**, JSX 이벤트 prop에 인라인 화살표로 작성해 파라미터 타입을 추론시킨다.

```tsx
// ❌ ts(6385) hint
const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => { e.preventDefault(); … };
<form onSubmit={onSubmit}>

// ✅ 추론 — deprecated 별칭 미참조
async function submit() { … }            // 이벤트 안 받음
<form onSubmit={(e) => { e.preventDefault(); void submit(); }}>
```

## 왜
deprecated 별칭을 코드에서 참조하는 순간 hint가 난다. JSX prop에 인라인으로 쓰면 `e`가 prop의 핸들러 시그니처에서 추론되어 별칭 이름을 코드에 적지 않으므로 hint가 사라진다. async 작업은 별도 함수로 빼고 `void`로 부른다(핸들러는 동기 시그니처).

## 적용
- 폼 submit, onChange 등 모든 island 이벤트 핸들러에 같은 패턴을 쓴다.
- typecheck 목표는 `0 errors / 0 warnings / 0 hints`. hint가 남으면 deprecated 별칭 참조부터 의심한다.
- 관련: [[web-dev-port-cors]]
