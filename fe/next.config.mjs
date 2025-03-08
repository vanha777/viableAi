// import type { NextConfig } from "next";

// const nextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'tzqzzuafkobkhygtccse.supabase.co',
//       },
//     ],
//   },
// }

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
      // Warning: This allows production builds to successfully complete even if
      // your project has ESLint errors.
      ignoreDuringBuilds: true,
  },
  images: {
      remotePatterns: [
          {
              protocol: 'https',
              hostname: '*.supabase.co',
              pathname: '/storage/v1/object/public/**',
          },
          {
              protocol: 'https',
              hostname: 'biz-touch-7unj.shuttle.app',
              pathname: '/api/**',
          },
      ],
  },
};

export default nextConfig;
