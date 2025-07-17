import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  poweredByHeader: false,
  compress: true,

  // Skip lint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Skip TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization
  images: {
    domains: ["ui-avatars.com", "images.unsplash.com"],
    formats: ["image/webp", "image/avif"],
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
