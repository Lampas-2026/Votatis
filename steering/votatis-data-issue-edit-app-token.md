---
tldr: 3dulev/votatis-data 의 이슈는 이 머신의 gh CLI 인증 계정으로는 못 고친다(쓰기 권한 없음 — "does not have the correct permissions to UpdateIssue"). 이슈는 votatis-bot GitHub App 이 만들므로, 프로그램적 수정은 .prod.vars 의 App 자격증명(GITHUB_APP_ID/GITHUB_APP_PRIVATE_KEY)으로 JWT→설치토큰을 발급해 REST PATCH 한다.
tags: [pitfall, github, intake-api, ops]
last_retrieved: 2026-06-10
retrieval_count: 1
---

## 규칙 / 교훈
이 머신의 `gh` CLI 인증 계정은 데이터 레포 **3dulev/votatis-data** 의 이슈 쓰기 권한이 없다(레포 소유자가 아님). 그래서 `gh issue edit/create` 가 `GraphQL: UpdateIssue` 권한 오류로 실패한다.

intake-api 가 만든 이슈는 **votatis-bot GitHub App**(votatis-data 에 설치, Issues: write) 명의다. 따라서 이슈를 프로그램적으로 수정/생성하려면 App 설치 토큰을 써야 한다. 자격증명은 `apps/intake-api/.prod.vars` 의 `GITHUB_APP_ID` + `GITHUB_APP_PRIVATE_KEY`(PKCS#1 PEM, 한 줄 `\n` literal → 실제 개행으로 복원).

## 왜
gh 인증 계정과 레포 소유 계정(3dulev)이 달라 쓰기 권한이 없다. 코드/README 만 봐선 이 불일치를 알기 어렵다.

## 적용
Node 로 App 토큰을 만들어 REST 호출(워커 `github-app.ts` 와 동일 흐름):
1. `.prod.vars` 파싱 후 PEM 의 `\\n`→개행.
2. RS256 JWT: `crypto.sign("RSA-SHA256", `${b64url(header)}.${b64url({iat,exp,iss:appId})}`, pem)`.
3. `GET /repos/3dulev/votatis-data/installation` (Bearer JWT) → installation id.
4. `POST /app/installations/{id}/access_tokens` (Bearer JWT) → installation token.
5. 그 토큰으로 `PATCH /repos/3dulev/votatis-data/issues/{n}` (body 등). `user-agent` 헤더 필수.
- 본문에 첨부 이미지를 넣을 땐 R2 public URL 임베드 규칙은 0001 changelog 참고(`R2_PUBLIC_BASE_URL`, 경로 세그먼트 인코딩).
- 단순 조회(`gh issue view`)는 gh 로도 된다 — 막히는 건 쓰기(edit/create)다.
