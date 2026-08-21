import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["tailwind-merge"],
};

export default withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Serwist does not support Turbopack. Dev runs on `next dev --turbo`
  // (npm run dev), so disable the service worker there; production
  // `next build` uses webpack and regenerates public/sw.js as expected.
  disable: process.env.NODE_ENV !== "production",
})(nextConfig);
