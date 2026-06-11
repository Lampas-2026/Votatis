import { applyD1Migrations, env } from "cloudflare:test";

// 각 테스트 워커 시작 시 D1 스키마(마이그레이션)를 적용한다(idempotent).
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
