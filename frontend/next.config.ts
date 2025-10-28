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
      // *** ลบ Rule นี้ออกไป ***
      // {
      //   source: "/admin/:path*",
      //   destination: `${backendUrl}/admin/:path*`,
      // },
      {
        // Rule นี้จะจับคู่ request ที่ขึ้นต้นด้วย /api/ ทั้งหมด (รวมถึง /api/admin/)
        // และส่งต่อไปยัง Backend
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      // Rule นี้อาจจะไม่จำเป็นแล้ว เพราะถูกครอบคลุมโดย rule ข้างบน
      // แต่เก็บไว้ก็ได้ถ้าต้องการความชัดเจน หรือมี logic พิเศษ
      // {
      //   source: "/api/cars/images/:path*",
      //   destination: `${backendUrl}/api/cars/images/:path*`,
      // },
    ];
  },
};

export default nextConfig;