import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

// Load root .env file natively in Node 22
try {
  const rootEnv = path.resolve(process.cwd(), "../.env");
  if (fs.existsSync(rootEnv)) {
    process.loadEnvFile(rootEnv);
  }
} catch {
  // ignore
}

const DEFAULT_BACKEND_URL = "https://agricultural-marketplace-hthx.onrender.com";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
const resolvedApiUrl = rawApiUrl
  ? rawApiUrl.split('#')[0].trim().replace(/\/+$/, '')
  : DEFAULT_BACKEND_URL;

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: resolvedApiUrl,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "223577954617-t6a485t3ej0cgjjkiks5s4oggigoku80.apps.googleusercontent.com",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${resolvedApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
