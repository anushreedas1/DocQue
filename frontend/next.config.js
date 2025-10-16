/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hardcoded environment variables
  env: {
    NEXT_PUBLIC_API_URL: 'https://docque.onrender.com',
    NEXT_PUBLIC_ENVIRONMENT: 'production',
    NEXT_PUBLIC_APP_NAME: 'DocQue',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_MAX_FILE_SIZE: '10485760',
    NEXT_PUBLIC_ALLOWED_FILE_TYPES: '.pdf,.txt',
    NEXT_PUBLIC_ITEMS_PER_PAGE: '10',
    NEXT_PUBLIC_MAX_QUERY_LENGTH: '500',
    NEXT_PUBLIC_ENABLE_LOGGING: 'false',
    NEXT_PUBLIC_ENABLE_ANALYTICS: 'false',
  },

  // Production optimizations (hardcoded)
  poweredByHeader: false,
  compress: true,
  
  // Output configuration for production
  output: 'standalone',
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,

  // Image optimization (hardcoded)
  images: {
    domains: ['docque.onrender.com'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false,
  },

  // No rewrites needed - direct API calls
  async rewrites() {
    return [];
  },

  // Security headers (hardcoded)
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