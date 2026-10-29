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

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  },
};

export default nextConfig;
