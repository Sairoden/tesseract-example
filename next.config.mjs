/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // "pdfjs-dist/webpack": "pdfjs-dist/build/webpack",
    };
    return config;
  },
};

export default nextConfig;
