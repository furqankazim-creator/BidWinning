import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow CI/verification builds to run alongside a dev server: BUILD_DIR=.next-build npx next build
  distDir: process.env.BUILD_DIR || ".next",
};

export default nextConfig;
