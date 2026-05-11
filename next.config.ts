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
    return [
      {
        // This matches any request starting with /proxy-api
        source: "/proxy-api/:path*",
        // This redirects it to the backend WITHOUT the browser knowing
        destination: "https://click-backend-j7yi.onrender.com/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;