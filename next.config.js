const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");

// Lets `next dev` reach the real KV binding (lib/auth/officials-kv.ts) via a
// local Miniflare-simulated Cloudflare environment, so local dev needs no
// wrangler flow of its own — same real code path runs in production.
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
    // Cloudflare Workers has no sharp binary, so next/image's default
    // Node-based optimizer breaks in production there (confirmed against
    // OpenNext's Cloudflare docs, not guessed). unoptimized: true skips
    // resizing/format conversion but keeps everything <Image> still gives
    // for free: lazy loading below the fold, layout-stable rendering (no
    // CLS), and priority preload for the hero image. Cloudflare's own
    // "IMAGES" binding is the stronger path if real on-the-fly resizing is
    // wanted later — see opennext.js.org/cloudflare/howtos/image.
    unoptimized: true,
  },
};

module.exports = nextConfig;
