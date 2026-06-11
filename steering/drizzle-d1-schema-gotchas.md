---
tldr: drizzle-orm 0.36(D1/sqliteTable)에서 인덱스 등 extraConfig 콜백은 배열 `(t)=>[...]`이 아니라 객체 `(t)=>({ name: index(...).on(...) })` 형태여야 한다(배열형은 TS2769 "IndexBuilder[] not assignable to SQLiteTableExtraConfig"). 마이그레이션은 drizzle-kit generate(파일만) → wrangler d1 migrations apply 로 적용.
tags: [pitfall, drizzle, d1, cloudflare]
last_retrieved: 2026-06-10
retrieval_count: 0
---

## 규칙 / 교훈
`drizzle-orm@0.36`로 D1(SQLite) 테이블을 정의할 때:

1. **extraConfig는 객체형**: `sqliteTable("t", {...}, (t) => ({ statusIdx: index("idx").on(t.status) }))`. 최신 문서에 흔한 **배열형 `(t) => [ index(...) ]`은 0.36에서 컴파일 에러**(TS2769, `IndexBuilder[]` is not assignable to `SQLiteTableExtraConfig`)다. 배열형은 이후 버전 API.
2. **마이그레이션 흐름**: `drizzle-kit generate`(drizzle.config.ts: `dialect:"sqlite", driver:"d1-http", schema, out:"./migrations"`)는 `migrations/*.sql`만 만든다. 실제 적용은 wrangler가 한다 — `wrangler d1 migrations apply <db> --local|--remote`. drizzle-kit이 D1에 직접 push하지 않는다.
3. **JSON 컬럼**: `text("col", { mode: "json" }).$type<T>()`. 배열/객체를 그대로 저장. 단 JSON 내부 필터(태그 포함검색 등)는 인덱스를 못 타므로 `LIKE`/`json_each` 수준에서만.

## 왜
- 배열/객체형 차이는 버전에 따라 갈려서, 최신 예제를 그대로 베끼면 설치된 버전(0.36)에서 바로 깨진다. 한 번 겪으면 즉시 객체형으로 쓰면 된다.

## 적용
- 0.36에서 스키마 작성 시 처음부터 객체형 extraConfig로. 버전 올릴 때 배열형 전환 여부 확인.
- 스키마 바꾸면 `pnpm db:generate` 후 `db:migrate:local`(+배포 시 `db:migrate:remote`). 테스트는 [[cloudflare-vitest-pool-workers-setup]]의 readD1Migrations/applyD1Migrations 패턴.
