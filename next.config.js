// Build configuration for Next.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output mode for Docker compatibility
  output: 'standalone',

  // Image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
  },

  // Route Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/about',
        destination: '/login',
        permanent: false,
      },
    ];
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
