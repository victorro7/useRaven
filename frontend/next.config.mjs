/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.clerk.com'], // Add this line
  },
  webpack(config) {
      config.module.rules.push({
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          use: ['@svgr/webpack'], // Use SVGR for handling SVGs
      });

      return config;
  },
}

export default nextConfig;