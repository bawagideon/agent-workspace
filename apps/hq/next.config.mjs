/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@gideon/shared',
    '@gideon/policy',
    '@gideon/tools',
    '@gideon/runner',
    '@gideon/runtime',
    '@gideon/agents',
    '@gideon/memory'
  ]
};

export default nextConfig;
