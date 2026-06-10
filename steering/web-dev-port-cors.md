---
tldr: apps/web(Astro)를 로컬에서 intake-api와 붙일 땐 dev 서버를 포트 5173으로 띄워야 한다(Astro 기본은 4321). intake-api ALLOWED_ORIGIN이 http://localhost:5173이라 그래야 CORS가 통과. 포트가 점유돼 폴백되면 intake-api를 --var ALLOWED_ORIGIN으로 그 포트에 맞춰라.
tags: [pitfall, cors, web, intake-api]
last_retrieved: 2026-06-10
retrieval_count: 3
---

## 규칙 / 교훈
`apps/web`(Astro)와 `apps/intake-api`를 로컬에서 함께 띄워 제보 흐름을 검증할 때:

- web dev는 **포트 5173**으로 고정한다. `apps/web/package.json`의 dev 스크립트가 `astro dev --port 5173`. (Astro 기본 포트는 4321이라 그냥 띄우면 안 맞는다.)
- intake-api의 `ALLOWED_ORIGIN`은 `http://localhost:5173`(`wrangler.jsonc` vars). web 오리진이 여기와 일치해야 `POST /submissions` preflight/요청이 통과한다.
- 5173이 다른 프로세스에 점유되면 Astro가 자동으로 5174 등으로 **폴백**한다. 이때는 intake-api를 그 포트에 맞춰야 한다:
  `wrangler dev --var ALLOWED_ORIGIN:http://localhost:5174 ...` (관련: [[intake-api-local-flow-test]]).

## 왜
intake-api는 익명 공개 엔드포인트라 CORS를 허용 오리진으로 좁혀 둔다(0001 요구사항 11). 오리진이 1바이트라도 다르면 `Access-Control-Allow-Origin`이 안 내려가 브라우저가 막는다. dev 포트 불일치는 "API는 200인데 브라우저에서만 실패"로 나타나 디버깅이 헷갈린다.

## 적용
- 운영 배포 도메인이 정해지면 5173 가정은 버리고 `ALLOWED_ORIGIN`·R2 CORS·Turnstile domains를 그 도메인으로 갱신한다(`docs/intake-api.md §6` 체크리스트, spec 0003 §7).
- 빌드 타임 base path는 `PUBLIC_BASE_PATH`(기본 `/`)로 주입한다(CORS와 무관, 별개 변수).
