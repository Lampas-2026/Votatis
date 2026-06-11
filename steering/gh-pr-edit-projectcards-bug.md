---
tldr: `gh pr edit`(과 일부 pr 쓰기)이 "Projects (classic) is being deprecated … (repository.pullRequest.projectCards)" GraphQL 오류로 실패할 수 있다. 본문 수정은 REST 로 우회: `gh api -X PATCH /repos/<owner>/<repo>/pulls/<n> --input <json>` (json 은 {"body": "..."}).
tags: [pitfall, github, gh-cli]
last_retrieved: 2026-06-10
retrieval_count: 0
---

## 규칙 / 교훈
`gh pr edit <n> --repo … --body-file …` 이 다음 오류로 실패하는 경우가 있다:
```
GraphQL: Projects (classic) is being deprecated … (repository.pullRequest.projectCards)
```
gh 가 PR 을 먼저 GraphQL 로 조회하며 deprecated 된 projectCards 필드를 건드려서다(편집은 적용되지 않음).

우회 — REST API 로 본문만 PATCH:
```
node: fs.writeFileSync("p.json", JSON.stringify({body: newBody}))
gh api -X PATCH /repos/<owner>/<repo>/pulls/<n> --input p.json
```
이슈 본문도 같은 식(`/issues/<n>`)으로 PATCH 가능. body 에 줄바꿈·코드블럭이 많으니 `-f` 대신 `--input <json파일>` 을 쓴다.

## 왜
gh CLI 의 GraphQL 경로가 deprecated 필드에 걸려 깨진다. REST PATCH 는 그 경로를 안 타서 동작한다.

## 적용
- PR/이슈 본문 프로그램적 수정은 처음부터 `gh api -X PATCH … --input` 으로 가는 게 안전하다.
- PR 생성(`gh pr create`)은 정상 동작했다 — 막히는 건 edit 류다.
- 관련: [[project-gh-account]].
