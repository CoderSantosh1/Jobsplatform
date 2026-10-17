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
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon.png' }];
  },
};

module.exports = nextConfig;