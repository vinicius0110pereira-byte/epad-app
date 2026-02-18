import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ["bcryptjs", "pg", "@prisma/adapter-pg"],
};

export default nextConfig;
