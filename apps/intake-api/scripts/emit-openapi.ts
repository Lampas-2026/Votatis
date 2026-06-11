import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import app from "../src/app";

// OpenAPI 스펙(Zod→@hono/zod-openapi)을 파일로 방출한다. 워커를 띄우지 않고 생성 가능.
// 소비자(apps/frontend)가 이 파일에서 타입을 생성한다(openapi-typescript). source of truth.
const doc = app.getOpenAPI31Document({
  openapi: "3.1.0",
  info: { title: "Votatis Intake API", version: "1.0.0" },
});

const out = fileURLToPath(new URL("../openapi.json", import.meta.url));
writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");
console.log(`openapi.json written: ${out}`);
