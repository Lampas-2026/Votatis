import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// base path 는 빌드 시점 환경변수(PUBLIC_BASE_PATH)로 주입한다.
// - Cloudflare Pages / 커스텀 도메인: "/"
// - GitHub Pages 프로젝트 페이지: "/<repo>/"
// astro.config 는 빌드 타임이라 import.meta.env 대신 process.env 를 읽는다.
const base = process.env.PUBLIC_BASE_PATH ?? "/";

// https://astro.build/config
export default defineConfig({
  output: "static",
  base,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
