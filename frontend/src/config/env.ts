// Environment configuration
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
} as const;
