import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Use environment variable or detect Docker environment
    // In Docker, we use the backend service name; otherwise localhost
    const isDocker = process.env.DOCKER_ENV === "true";
    const isDev = process.env.NODE_ENV === "development";

    let backendUrl;
    if (isDocker) {
      // Running in Docker Compose - use backend service name
      backendUrl = "http://backend:8080";
    } else if (isDev) {
      // Local development - use localhost
      backendUrl = "http://localhost:8080";
    } else {
      // Production deployment
      backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.carjai.com";
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
      {
        source: "/api/cars/images/:path*",
        destination: `${backendUrl}/api/cars/images/:path*`,
      },
    ];
  },
};

export default nextConfig;
