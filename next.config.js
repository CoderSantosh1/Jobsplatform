/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
  },
  // Ensure static files are served correctly
  poweredByHeader: false,
  compress: true,
  async redirects() {
    return [
      // Send the bare domain straight to https://www (one permanent hop instead of a temporary 307).
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'sarkariresultsnow.com' }],
        destination: 'https://www.sarkariresultsnow.com/:path*',
        permanent: true,
      },
      // Old footer links that used to 404.
      { source: '/latest-jobs', destination: '/jobs', permanent: true },
      { source: '/admit-card', destination: '/admit-cards', permanent: true },
      { source: '/answer-key', destination: '/answer-keys', permanent: true },
      { source: '/contact-us', destination: '/contact', permanent: true },
      { source: '/syllabus', destination: '/quizzes', permanent: true },
      { source: '/search', destination: '/', permanent: true },
    ];
  },
  // Basic hardening headers for every response. (No Content-Security-Policy: AdSense/Analytics load scripts from
  // many Google domains, so a CSP would need careful tuning to avoid breaking ads.)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
    ];
  },
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon.png' }];
  },
};

module.exports = nextConfig;