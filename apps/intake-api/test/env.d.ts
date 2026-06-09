import type { Env } from "../src/types";

declare module "cloudflare:test" {
  // cloudflare:test 의 env 를 Worker 의 Env 로 타입 지정
  interface ProvidedEnv extends Env {}
}
