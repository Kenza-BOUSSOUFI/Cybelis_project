import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/terms",
        destination: "/legal/conditions-utilisation",
        permanent: true,
      },
      {
        source: "/terms-of-use",
        destination: "/legal/conditions-utilisation",
        permanent: true,
      },
      {
        source: "/cgu",
        destination: "/legal/conditions-utilisation",
        permanent: true,
      },
      {
        source: "/privacy",
        destination: "/legal/politique-confidentialite",
        permanent: true,
      },
      {
        source: "/privacy-policy",
        destination: "/legal/politique-confidentialite",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
