---
tldr: 루트 .gitignore가 파이썬 템플릿 기반이라 `lib/`(line 17, venv용)가 앱 소스 디렉터리 `apps/*/src/lib/`까지 싸잡아 무시한다. 새 앱의 src/lib 소스가 조용히 미추적되니, `!apps/<app>/src/lib/` 예외를 추가해야 추적된다.
tags: [pitfall, git, gitignore, monorepo, web]
last_retrieved: 2026-06-10
retrieval_count: 1
---

## 규칙 / 교훈
이 repo 루트 `.gitignore`는 GitHub Python 템플릿에서 출발했다. 그래서 `lib/`·`lib64/`·`parts/`·`.eggs/` 같은 패턴이 있고, 그중 **`lib/`(앵커 없음)는 어느 깊이의 `lib/` 디렉터리든 매칭**한다 → `apps/web/src/lib/`(소스: api.ts·exif.ts 등)가 통째로 무시됐었다(빌드 산출물이 아니라 소스인데).

- 증상: 소스 파일을 만들고 수정해도 `git status`에 안 뜨고, `git show HEAD:<path>`가 "exists on disk, but not in HEAD". `git check-ignore -v <path>`로 확인하면 `.gitignore:17:lib/`가 잡는다.
- 조치: 해당 디렉터리 예외를 `lib/` 뒤에 추가. 예: `!apps/web/src/lib/`. (현재 적용됨)

## 왜
파이썬 venv `lib/`를 무시하려던 규칙이 JS/모노레포의 소스 `src/lib/`까지 잡아, **소스가 버전관리에서 빠진 채로 로컬에서만 동작**한다(fresh clone 시 빌드 불가). 한 번 당하면 "수정이 커밋 안 됨"으로 헷갈린다.

## 적용
- 새 앱/패키지에 `src/lib/`(또는 다른 `lib/` 소스)를 두면, 자동으로 미추적되니 `.gitignore`에 `!apps/<app>/src/lib/` 예외를 추가하고 `git check-ignore -v`로 확인한다.
- 커밋 전 `git status`에 기대한 파일이 없으면 gitignore부터 의심.
- **업스트림/외부에서 머지한 코드도 이 함정의 피해자일 수 있다**: Lampas-2026 upstream의 `frontend/`가 `src/lib/`가 ignore돼 커밋되지 않은 채 머지돼(예: `src/lib/types.ts` 누락) `@/lib/*` import가 깨지고 빌드 실패. 머지 후 빌드가 "Module not found: @/lib/..."면 누락 lib 소스 복원이 필요(원본 제공 or 재구성). `apps/frontend`도 예외(`!apps/frontend/src/lib/`) 추가 대상.
