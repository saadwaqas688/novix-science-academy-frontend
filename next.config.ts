import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Docker builds set NEXT_OUTPUT=standalone; Netlify/Vercel use their own adapters.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
