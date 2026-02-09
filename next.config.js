# Build configuration for Next.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output mode for Docker compatibility
  output: 'standalone',

  // Image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
  },

  // Security headers
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
