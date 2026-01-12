/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Image configuration
  images: {
    // เปลี่ยนจาก domains เป็น remotePatterns
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
    ],
  },
  
  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Environment variables
  env: {
    APP_NAME: 'UNOGROUP Sales Management',
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to import these on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
