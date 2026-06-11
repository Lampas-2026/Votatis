import { defineConfig } from "drizzle-kit";

// D1(SQLite) 스키마 → migrations/*.sql 생성용. 적용은 wrangler d1 migrations apply 로 한다.
export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  schema: "./src/db/schema.ts",
  out: "./migrations",
});
