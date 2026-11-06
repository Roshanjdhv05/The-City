/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // avoids double-mounting WebGL contexts in dev
  transpilePackages: ['three'],
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
