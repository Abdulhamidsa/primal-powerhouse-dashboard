// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  ...(process.env.NEXT_DIST_DIR?.trim() ? { distDir: process.env.NEXT_DIST_DIR.trim() } : {}),
  ...(process.env.NEXT_TSCONFIG_PATH?.trim()
    ? { typescript: { tsconfigPath: process.env.NEXT_TSCONFIG_PATH.trim() } }
    : {}),
  poweredByHeader: false,
  compress: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'www.exercisedb.dev' },
      { protocol: 'https', hostname: 'static.exercisedb.dev' },
      { protocol: 'https', hostname: 'cdn.exercisedb.dev' },
      { protocol: 'https', hostname: 'example.com' },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  async headers() {
    return [
      ...(process.env.NODE_ENV !== 'production'
        ? [
            {
              source: '/api/:path*',
              has: [
                {
                  type: 'header' as const,
                  key: 'origin',
                  value: '(?<corsOrigin>http:\\/\\/(?:localhost|127\\.0\\.0\\.1|\\[::1\\])(?::\\d+)?)',
                },
              ],
              headers: [
                { key: 'Access-Control-Allow-Origin', value: ':corsOrigin' },
                { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
                { key: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type' },
                { key: 'Vary', value: 'Origin' },
              ],
            },
          ]
        : []),
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
