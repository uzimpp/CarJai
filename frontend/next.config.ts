import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Docker-aware backend URL configuration
    const isDocker = process.env.DOCKER_ENV === "true";
    const isDev = process.env.NODE_ENV === "development";

    let backendUrl;
    if (isDocker) {
      // Inside Docker containers, use service name (regardless of NODE_ENV)
      backendUrl = "http://backend:8080";
    } else if (isDev) {
      // Local development outside Docker
      backendUrl = "http://localhost:8080";
    } else {
      // Production deployment (not Docker)
      backendUrl = "https://api.carjai.com"; // Change to your actual API URL
    }

    console.log(
      `🔧 Next.js Rewrites: Docker=${isDocker}, Dev=${isDev}, Backend URL: ${backendUrl}`
    );

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
