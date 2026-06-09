---
tldr: package.json의 deploy 같은 스크립트는 `pnpm --filter <pkg> run deploy`로 실행한다. `run` 없이 쓰면 pnpm 내장 deploy 명령과 충돌해 ERR_PNPM_INVALID_DEPLOY_TARGET.
tags: [pitfall, pnpm, monorepo]
last_retrieved: 2026-06-09
retrieval_count: 2
---

## 규칙 / 교훈
워크스페이스 패키지의 npm 스크립트를 돌릴 때, 이름이 pnpm 내장 명령과 겹치면 반드시 `run`을 붙인다.
- ✅ `pnpm --filter votatis-intake-api run deploy`
- ❌ `pnpm --filter votatis-intake-api deploy` → `ERR_PNPM_INVALID_DEPLOY_TARGET` (pnpm 내장 `deploy` 명령으로 해석됨)

`deploy` 외에 `test`/`install`/`add`/`publish` 등 내장과 겹치는 이름도 동일. 안전하게 항상 `run <script>`를 붙이는 편이 낫다.

## 왜
pnpm은 `deploy`를 자체 서브커맨드로 가진다. `run` 없이 스크립트명을 주면 스크립트가 아니라 내장 명령으로 먼저 해석되어 실패한다.

## 적용
- 배포: `pnpm --filter votatis-intake-api run deploy`
- docs/intake-api.md §3의 `pnpm --filter votatis-intake-api deploy` 표기는 이 함정이 있다(개별 패키지 디렉터리에서 `wrangler deploy`는 정상).
