// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from redirecting URLs with/without trailing slashes
  skipTrailingSlashRedirect: true,

  async rewrites() {
    // ... (ส่วน Logic การหา backendUrl ของคุณถูกต้องแล้ว) ...
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
      // *** นี่คือ Rule ที่ต้องเอาคอมเมนต์ออก ***
      // มันจะจับคู่ /admin/auth/signin และส่งต่อไปที่ backend
      {
        source: "/admin/:path*",
        destination: `${backendUrl}/admin/:path*`,
      },
      // Rule นี้สำหรับ API ส่วนของ User (ถูกต้องอยู่แล้ว)
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
