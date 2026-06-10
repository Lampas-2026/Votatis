import type { Env } from "../src/types";

declare module "cloudflare:test" {
  // cloudflare:test 의 env 를 Worker 의 Env + 테스트 전용 바인딩으로 타입 지정
  interface ProvidedEnv extends Env {
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}
