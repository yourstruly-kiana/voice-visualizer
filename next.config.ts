import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'p5/sound': 'p5/lib/addons/p5.sound',
    };
    return config;
  },
};

export default nextConfig;
