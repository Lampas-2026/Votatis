import type { Env } from "./types";
import { preflight } from "./cors";
import { handleSubmissions } from "./submissions";
import { handleFinalize } from "./finalize";

const FINALIZE_RE = /^\/submissions\/([^/]+)\/finalize$/;

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return preflight(env, request);

    if (request.method === "POST" && url.pathname === "/submissions") {
      return handleSubmissions(request, env);
    }

    const m = FINALIZE_RE.exec(url.pathname);
    if (request.method === "POST" && m) {
      return handleFinalize(request, env, decodeURIComponent(m[1]));
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
