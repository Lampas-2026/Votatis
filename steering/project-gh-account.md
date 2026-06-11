---
tldr: 코드 레포는 fork 구조 — origin push 는 3dulev/Votatis(fork), PR 은 업스트림 Lampas-2026/Votatis(default main)로 올린다(`gh pr create --repo Lampas-2026/Votatis --base main --head 3dulev:<branch>`). gh 쓰기 전 `gh api user`로 3dulev 계정인지 확인(아니면 `gh auth switch`). git commit author 와 gh API 인증은 별개다.
tags: [convention, github, ops, project]
last_retrieved: 2026-06-10
retrieval_count: 2
---

## 규칙 / 교훈
코드 레포는 fork 구조다:
- **origin** = `3dulev/Votatis`(fork). 브랜치 push 는 여기로(이미 `git push`로 됨).
- **업스트림** = `Lampas-2026/Votatis`(default `main`). **PR 은 여기로** 올린다.
- cross-fork PR: `gh pr create --repo Lampas-2026/Votatis --base main --head 3dulev:<branch>`.

gh 계정:
- 한 머신에 여러 gh 계정이 있을 수 있고 active 가 3dulev 가 아닐 수 있다. **gh 쓰기 전** `gh api user --jq .login` 으로 실제 인증 계정 확인(`gh auth status` keyring 표시보다 정확, `GH_TOKEN` env 가 우선하기도). 3dulev 가 아니면 `gh auth switch` 또는 `export GH_TOKEN=<3dulev PAT>`.

## 왜
- 업스트림에 올려야 하므로 `--repo`/`--head owner:branch` 를 명시하지 않으면 fork(3dulev/Votatis) 안에 잘못된 PR 이 만들어진다(한 번 그래서 닫고 재생성함).
- git commit author(`git config user`)가 3dulev여도 gh API 인증은 별개라, active 가 다르면 PR author 가 엉뚱해지거나 권한 오류가 난다.

## 적용
- PR 만들기: `gh api user`로 3dulev 확인 → `gh pr create --repo Lampas-2026/Votatis --base main --head 3dulev:<branch> ...`.
