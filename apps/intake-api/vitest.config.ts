import { defineWorkersConfig, readD1Migrations } from "@cloudflare/vitest-pool-workers/config";

// 테스트 D1 에 적용할 마이그레이션을 읽어 바인딩으로 주입한다(setup 에서 applyD1Migrations).
const migrations = await readD1Migrations("./migrations");

export default defineWorkersConfig({
  test: {
    setupFiles: ["./test/apply-migrations.ts"],
    poolOptions: {
      workers: {
        isolatedStorage: false,
        miniflare: {
          compatibilityDate: "2026-06-01",
          compatibilityFlags: ["nodejs_compat"],
          d1Databases: ["DB"],
          r2Buckets: ["EVIDENCE_BUCKET"],
          bindings: {
            ALLOWED_ORIGIN: "https://app.test",
            R2_ACCOUNT_ID: "testacct",
            R2_BUCKET: "votatis-evidence",
            TURNSTILE_SECRET: "test-secret",
            R2_ACCESS_KEY_ID: "test-akid",
            R2_SECRET_ACCESS_KEY: "test-secret-key",
            TEST_MIGRATIONS: migrations,
          },
        },
      },
    },
  },
});
