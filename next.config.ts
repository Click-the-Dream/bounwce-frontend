import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "via.placeholder.com", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
    ],
  },
  async rewrites() {
    // ONLY apply the proxy if we are running locally
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: "/proxy-api/:path*",
          destination: "https://click-backend-j7yi.onrender.com/api/v1/:path*",
        },
      ];
    }
    // Return an empty array in production
    return [];
  },
};

export default nextConfig;