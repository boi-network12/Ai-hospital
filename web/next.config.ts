import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Compiler (Next.js 15+)
  reactCompiler: true,

  // Allow external images from trusted hosts
  images: {
    remotePatterns: [
      // Cloudinary (your avatars)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },

      // Optional: Common CDNs you might use
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
        pathname: "/**",
      },
    ],
  },

  // Optional: Improve logging during dev
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;