import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/fighters',
        destination: 'https://ultimateframedata.com/sf6/',
        permanent: false,
      },
      // Renamed routes — keep old URLs working (bookmarks/SEO) with a permanent (308) redirect.
      { source: '/frame-data', destination: '/guide',     permanent: true },
      { source: '/challenges', destination: '/challenge', permanent: true },
    ]
  },
};

export default nextConfig;
