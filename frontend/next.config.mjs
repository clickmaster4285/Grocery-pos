/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 1. Remove the old 'domains' array to avoid conflicts
    // 2. Add rules for both localhost and 127.0.0.1
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/api/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
        pathname: '/api/**',
      },
    ],
  },
};

export default nextConfig;