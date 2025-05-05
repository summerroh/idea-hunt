import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    SEARCH_ENGINE_ID: process.env.SEARCH_ENGINE_ID,
  },
};

export default nextConfig;
