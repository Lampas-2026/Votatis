import type { NextConfig } from "next";

// 정적 사이트(SSG) 출력. `next build` → `out/` (Node 서버 없이 정적 호스팅, Cloudflare Pages).
// SSG에선 next/image 서버 최적화가 불가하므로 unoptimized(정적 <img>).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
