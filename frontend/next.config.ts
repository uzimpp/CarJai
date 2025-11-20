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

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
