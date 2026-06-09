import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

// 테스트 전용 더미 RSA 키 (실 권한 없음) — JWT 서명 경로 검증용
const TEST_APP_KEY = readFileSync(
  fileURLToPath(new URL("./test/test-app-key.pem", import.meta.url)),
  "utf8",
);

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        isolatedStorage: false,
        miniflare: {
          compatibilityDate: "2026-06-01",
          compatibilityFlags: ["nodejs_compat"],
          kvNamespaces: ["PENDING_KV"],
          r2Buckets: ["EVIDENCE_BUCKET"],
          bindings: {
            ALLOWED_ORIGIN: "https://app.test",
            GITHUB_REPO: "3dulev/votatis-data",
            R2_ACCOUNT_ID: "testacct",
            R2_BUCKET: "votatis-evidence",
            TURNSTILE_SECRET: "test-secret",
            GITHUB_APP_ID: "123456",
            GITHUB_APP_PRIVATE_KEY: TEST_APP_KEY,
            R2_ACCESS_KEY_ID: "test-akid",
            R2_SECRET_ACCESS_KEY: "test-secret-key",
          },
        },
      },
    },
  },
});
