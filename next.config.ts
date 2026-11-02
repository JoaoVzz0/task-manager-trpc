import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Temporary (307), so the landing page can change without clients
    // caching the redirect.
    return [{ source: "/", destination: "/tasks", permanent: false }];
  },
};

export default nextConfig;
