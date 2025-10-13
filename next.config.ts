import type { NextConfig } from 'next';

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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Webpack configuration to properly handle Prisma
  webpack: (config, { isServer }) => {
    // Prevent Prisma Client from being bundled for client-side code
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // This ensures Prisma is only used on the server side
        '@prisma/client': false,
      };
    }
    return config;
  },
};

export default nextConfig;
