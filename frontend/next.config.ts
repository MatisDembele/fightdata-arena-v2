import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/fighters',
        destination: 'https://ultimateframedata.com/sf6/',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
