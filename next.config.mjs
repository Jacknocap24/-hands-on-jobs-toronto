/** @type {import('next').NextConfig} */
const repo = process.env.GITHUB_REPOSITORY?.split('/')?.[1] || '';
const isPages = !!process.env.GITHUB_ACTIONS;

const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
  basePath: isPages && repo ? `/${repo}` : undefined,
  assetPrefix: isPages && repo ? `/${repo}/` : undefined,
};

export default nextConfig;


