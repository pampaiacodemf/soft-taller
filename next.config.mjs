/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  env: {
    NEXTAUTH_URL: "https://soft-taller.netlify.app",
    AUTH_URL: "https://soft-taller.netlify.app",
    AUTH_SECRET: "f3f1e9c2b4a5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1",
  },
};

export default nextConfig;
