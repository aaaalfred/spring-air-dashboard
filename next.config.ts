import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  output: "standalone",
  distDir: ".next-cache",
};

export default nextConfig;
