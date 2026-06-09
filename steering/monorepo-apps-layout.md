---
tldr: 코드(앱·서비스·패키지)는 항상 apps/<name>/ 아래에 두고 pnpm workspace로 묶는다. 루트는 specs/steering/docs/공통설정만. 새 코드는 루트가 아니라 apps/<name>/로 추가한다.
tags: [convention, project, monorepo, pnpm]
last_retrieved: 2026-06-09
retrieval_count: 0
---

## 규칙 / 교훈
이 프로젝트는 여러 앱을 담는 모노레포다.

- 모든 코드 패키지는 `apps/<name>/`에 둔다. 예: `apps/intake-api/`.
- pnpm workspace: 루트 `pnpm-workspace.yaml`(`packages: ["apps/*"]`), 단일 루트 `pnpm-lock.yaml`, 루트 `package.json`은 workspace root(`private: true`, 공통 스크립트, `pnpm.onlyBuiltDependencies`).
- 루트에 직접 코드(`src/`, `wrangler.jsonc` 등)를 두지 않는다. 루트엔 `specs/`·`steering/`·`docs/`·`.claude/`·워크스페이스 설정만.
- 시크릿(`.dev.vars`, `.prod.vars`)은 각 앱 디렉터리(`apps/<name>/`)에 두며 `.gitignore`가 파일명으로 무시한다.

## 왜
- 제보 수집 외에 웹앱·스크립트·검수 도구 등을 더 만들 예정이라, 처음부터 앱을 격리해야 의존성·배포·설정이 섞이지 않는다.

## 적용
- 새 앱 추가: `apps/<name>/` 만들고 그 안에 `package.json`(고유 name) + 코드. 루트에서 `pnpm install`이 자동 인식.
- 명령: 전체는 `pnpm -r test`/`pnpm -r typecheck`, 개별은 `pnpm --filter <pkg> <script>`.
- `pnpm.onlyBuiltDependencies`(workerd·esbuild 등)는 루트 `package.json`에 둔다 — workspace에선 루트 설정이 적용된다. 관련: [[cloudflare-vitest-pool-workers-setup]]

관련: [[spec-create-workflow]]
