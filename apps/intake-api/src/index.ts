import type { Env } from "./types";
import app from "./app";
import { cleanupPending } from "./cleanup";

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    // 만료된 pending(업로드 미완료) 레코드 정리. staging R2 객체는 R2 lifecycle 이 정리한다.
    await cleanupPending(env);
  },
} satisfies ExportedHandler<Env>;
