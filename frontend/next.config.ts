import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";

    let backendUrl;
    if (isDev) {
      // Local development with docker
      backendUrl = "http://localhost:8080";
    } else {
      // Production deployment
      backendUrl = "https://api.carjai.com";
    }

    return [
      {
        source: "/admin/:path*",
        destination: `${backendUrl}/admin/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
