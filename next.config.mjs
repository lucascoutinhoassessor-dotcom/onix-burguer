/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**"
      }
    ]
  },
  serverExternalPackages: ["whatsapp-web.js", "puppeteer", "puppeteer-core", "qrcode"]
};

export default nextConfig;
