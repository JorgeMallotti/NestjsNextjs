import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  /**
   * Proxy /api requests to the NestJS backend.
   *
   * The frontend calls its own origin (e.g. https://app.vercel.app/api/*)
   * and Next.js forwards those requests to the backend. This keeps the
   * HttpOnly auth cookie same-origin, so SameSite=Lax works and there is
   * no CORS in production.
   *
   * Set API_PROXY_TARGET in production, e.g.:
   *   API_PROXY_TARGET=https://comptech-backend.up.railway.app
   */
  async rewrites() {
    const backend = process.env.API_PROXY_TARGET ?? "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
