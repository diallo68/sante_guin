/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['mondocteur.org', 'www.mondocteur.org'],
    },
  },
  // Force all pages to be dynamic (SSR) — required for auth/cookies
  output: 'standalone',
};

module.exports = nextConfig;
