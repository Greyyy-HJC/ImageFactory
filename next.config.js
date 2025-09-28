/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix: isProd ? '/ImageFactory/' : '',
  basePath: isProd ? '/ImageFactory' : '',
};

module.exports = nextConfig;
