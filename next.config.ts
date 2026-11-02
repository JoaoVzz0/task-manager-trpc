import type { NextConfig } from "next";

const securityHeaders = [
  // Browsers must trust the declared Content-Type instead of guessing it.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites only learn our origin, never full URLs with task ids.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No other site may embed the app in a frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  // The Docker build sets NEXT_OUTPUT=standalone to ship only the files the
  // server actually uses. Everywhere else the default output is kept, because
  // `next start` (npm start, the E2E suite) does not support standalone.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Do not advertise the framework in every response.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Temporary (307), so the landing page can change without clients
    // caching the redirect.
    return [{ source: "/", destination: "/tasks", permanent: false }];
  },
};

export default nextConfig;
