import type { NextConfig } from "next";

const API_TARGET = process.env.API_TARGET || "http://localhost:1488";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_TARGET}/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${API_TARGET}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
