// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from redirecting URLs with/without trailing slashes
  skipTrailingSlashRedirect: true,

  async rewrites() {
    const isDocker = process.env.DOCKER_ENV === "true";
    const isDev = process.env.NODE_ENV === "development";

    let backendUrl;
    if (isDocker) {
      backendUrl = "http://backend:8080";
    } else if (isDev) {
      backendUrl = "http://localhost:8080";
    } else {
      backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.carjai.com";
    }

    return {
      beforeFiles: [
        // These rewrites are checked before pages/public files
        // They will match API requests with X-Requested-With header
        {
          source: "/admin/:path*",
          has: [
            {
              type: "header",
              key: "x-requested-with",
              value: "XMLHttpRequest",
            },
          ],
          destination: `${backendUrl}/admin/:path*`,
        },
      ],
      afterFiles: [
        // These rewrites are checked after pages but before dynamic routes
        {
          source: "/admin/:path*",
          destination: `${backendUrl}/admin/:path*`,
        },
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
