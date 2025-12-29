import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal configuration for build
  serverExternalPackages: ['@prisma/client'],
  // Disable all checks during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip image optimization
  images: {
    unoptimized: true,
  },
  // Disable telemetry
  telemetry: false,
};

export default nextConfig;
