/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/uploads/:path*',
            destination: `http://localhost:8000/uploads/:path*`, // Proxy to Backend
          },
        ]
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
