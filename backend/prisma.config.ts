import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load centralized root .env
const parentEnv = path.resolve(process.cwd(), "../.env");
const cwdEnv = path.resolve(process.cwd(), ".env");

if (fs.existsSync(parentEnv)) {
  dotenv.config({ path: parentEnv });
} else if (fs.existsSync(cwdEnv)) {
  dotenv.config({ path: cwdEnv });
} else {
  dotenv.config();
}

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || "",
  },
});
