---
tldr: 프런트(apps/frontend, Next dev)를 로컬에서 intake-api와 붙일 땐 dev 서버 포트(Next 기본 3000)와 intake-api ALLOWED_ORIGIN(wrangler.jsonc vars의 http://localhost:3000)이 일치해야 CORS 통과. 불일치면 "API는 200인데 브라우저만 실패". 포트가 다르면 intake-api를 --var ALLOWED_ORIGIN으로 맞춰라.
tags: [pitfall, cors, frontend, intake-api]
last_retrieved: 2026-06-10
retrieval_count: 4
---

## 규칙 / 교훈
`apps/frontend`(Next.js)와 `apps/intake-api`를 로컬에서 함께 띄워 제보 흐름을 검증할 때:

- frontend dev는 **포트 3000**(Next 기본). intake-api `ALLOWED_ORIGIN`(`wrangler.jsonc` vars)에 `http://localhost:3000`이 들어 있어야 `POST /submissions`·presigned PUT preflight/요청이 통과한다. (현재 값: `http://localhost:3000,https://votatis-web.pages.dev`)
- 포트가 점유돼 Next가 3001 등으로 폴백하면 intake-api를 그 포트에 맞춘다:
  `wrangler dev --var ALLOWED_ORIGIN:http://localhost:3001 ...` (관련: [[intake-api-local-flow-test]]).

> 이력: 과거 `apps/web`(Astro, 포트 5173)이 프런트였으나 spec 0007에서 `apps/frontend`(Next, 3000)로 대체·삭제됨. 5173 가정은 폐기.

## 왜
intake-api는 익명 공개 엔드포인트라 CORS를 허용 오리진으로 좁혀 둔다. 오리진이 1바이트라도 다르면 `Access-Control-Allow-Origin`이 안 내려가 브라우저가 막는다. dev 포트 불일치는 "API는 200인데 브라우저에서만 실패"로 나타나 디버깅이 헷갈린다.

## 적용
- 운영 배포 도메인이 정해지면 `ALLOWED_ORIGIN`·R2 CORS(`r2-cors.json`)·Turnstile domains를 그 도메인으로 갱신한다(`docs/intake-api.md` 체크리스트).
- CORS preflight 확인: `curl -s -o /dev/null -w "%{http_code}" -X OPTIONS localhost:8787/submissions -H "origin: http://localhost:3000" -H "access-control-request-method: POST"` → 204.
