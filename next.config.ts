import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Esto permite que Next.js acepte las imágenes que vienen de IPFS
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/ipfs/**',
      },
    ],
  },

  // 2. Tus rewrites que ya tenías y funcionan perfecto
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: process.env.GRAPHQL_API_URL || 'http://localhost:3001/graphql',
      },
    ];
  },
};

export default nextConfig;