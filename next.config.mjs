import { imageHosts } from './image-hosts.config.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',
  // This market feed opens a real Node WebSocket connection. Bundling it into
  // a route replaces parts of `ws` and breaks frame masking at runtime.
  serverExternalPackages: ['@mathieuc/tradingview', 'ws'],

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: imageHosts,
  }
};
export default nextConfig;
