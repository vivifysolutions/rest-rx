import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/admin/login", destination: "/portal/login", permanent: false },
      {
        source: "/admin/micro-rx",
        destination: "/admin/resources?type=Micro%20Rx",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
