---
tldr: Next 16 `output: 'export'`(SSG)에서 동적 라우트(`[id]`)는 generateStaticParams가 **빈 배열이면 "missing generateStaticParams" 에러**로 빌드 실패한다. 최소 1개 sentinel param 반환 + `export const dynamicParams = false`로 풀어야 한다(나머지 id는 404). 또 `.next` 캐시 탓에 에러가 라우트별로 번갈아 보고되니 수정 후 `rm -rf .next`.
tags: [pitfall, nextjs, ssg, frontend]
last_retrieved: 2026-06-10
retrieval_count: 0
---

## 규칙 / 교훈
`apps/frontend`(Next 16, `output: 'export'`)에서 동적 세그먼트 페이지(`app/.../[id]/page.tsx`)를 정적 빌드할 때:

1. **빈 배열 불가**: `generateStaticParams(){ return [] }` 만으로는 `Error: Page "/x/[id]" is missing "generateStaticParams()"`로 빌드가 깨진다(함수가 있어도). 빌드 타임에 id를 모르고 사전 생성할 게 없어도 **최소 1개 sentinel**을 줘야 한다:
   ```ts
   export const dynamicParams = false;        // 목록 밖 id는 404 (on-demand 렌더 불가)
   export function generateStaticParams() { return [{ id: "none" }]; }
   ```
   → `/x/none` 빈상태 페이지 1개만 생성, 나머지는 404. (실 데이터 연동 시 실제 id 목록 반환)
2. **`rm -rf .next`**: 여러 동적 라우트가 같은 문제일 때 Turbopack이 캐시로 **한 라우트씩 번갈아 에러**를 뱉어, 고쳤는데도 같은(또는 다른) 라우트가 계속 실패하는 것처럼 보인다. 수정 후 `.next` 비우고 재빌드해야 정확히 판정된다.

## 왜
- `output: 'export'`는 서버가 없어 on-demand 렌더가 불가하므로 모든 경로가 빌드 타임에 확정돼야 한다. 빈 목록은 "이 라우트를 어떻게 정적화할지 모름"으로 취급돼 막힌다. 캐시 때문에 원인 라우트를 오판하기 쉬워 시간을 버린다.

## 적용
- SSG에서 `[param]` 페이지엔 항상 `dynamicParams=false` + 최소 1개 params. 실 데이터(예: GET /reports)로 채울 수 있으면 그걸로, 아니면 sentinel.
- 빌드 에러가 안 변하거나 라우트를 오가면 `.next` 캐시부터 의심. [[gitignore-lib-catches-src-lib]](누락 모듈)와는 다른 증상.
