import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true,
  reactCompiler: true,
  experimental: {
    typedEnv: true,
    authInterrupts: true,
    optimizeCss: true,
    staleTimes: {
      dynamic: 300,
      static: 3600,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'cfww31lk7t.ufs.sh',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'gravatar.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: '*',
        port: '',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            // max-age=0: check with server every time (browser)
            // s-maxage=3600: cache for 1 hour at the Vercel Edge Network (CDN)
            // stale-while-revalidate: serve old content while background updating
            value:
              'public, max-age=0, s-maxage=3600, stale-while-revalidate=59',
          },
        ],
      },
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
