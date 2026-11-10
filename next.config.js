
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    domains: ['localhost'],
  },

  poweredByHeader: false,
  compress: true,

  // Application-level redirects
  // Domain redirects are managed by Netlify.
  async redirects() {
    return [
      {
        source: '/latest-jobs',
        destination: '/jobs',
        permanent: true,
      },
      {
        source: '/admit-card',
        destination: '/admit-cards',
        permanent: true,
      },
      {
        source: '/answer-key',
        destination: '/answer-keys',
        permanent: true,
      },
      {
        source: '/contact-us',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/syllabus',
        destination: '/quizzes',
        permanent: true,
      },
      {
        source: '/search',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Security headers
  async headers() {
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
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
    ];
  },

  // Firebase authentication rewrites
  async rewrites() {
    const rules = [
      {
        source: '/favicon.ico',
        destination: '/icon.png',
      },
    ];

    const firebaseProject =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (firebaseProject) {
      rules.push(
        {
          source: '/__/auth/:path*',
          destination: `https://${firebaseProject}.firebaseapp.com/__/auth/:path*`,
        },
        {
          source: '/__/firebase/:path*',
          destination: `https://${firebaseProject}.firebaseapp.com/__/firebase/:path*`,
        }
      );
    }

    return rules;
  },
};

module.exports = nextConfig;
