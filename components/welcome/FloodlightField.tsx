"use client";

import { motion } from "framer-motion";

// Ambient background: soft drifting floodlight glows + a faint gantry-truss
// grid, echoing the brand mark without repeating the logo itself.
//
// Was 5 simultaneous infinitely-animating blur-3xl (64px filter blur)
// regions, position: fixed behind a page that's almost entirely scroll
// (hero + 3 feature sections + CTA). CSS filter:blur doesn't composite as
// cheaply as a pure transform — animating several large blurred regions at
// once forces the browser to repeatedly repaint them, which is exactly what
// causes visible scroll jank on a long page like this one. Cut to 3 glows
// and a lighter blur radius (blur-2xl instead of blur-3xl) — noticeably
// cheaper to paint while still reading as the same soft ambient glow.
const GLOWS = [
  { x: "10%", y: "15%", size: 380, color: "#2DD4E8", duration: 24, delay: 0 },
  { x: "80%", y: "12%", size: 320, color: "#22C55E", duration: 28, delay: 2 },
  { x: "20%", y: "75%", size: 340, color: "#F5A623", duration: 26, delay: 1 },
];

export function FloodlightField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-surface">
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" aria-hidden>
        <defs>
          <pattern id="truss" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M0 32H64M32 0V64M0 0L64 64M64 0L0 64" stroke="#EDF1F3" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#truss)" />
      </svg>

      {GLOWS.map((glow, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-2xl will-change-transform"
          style={{
            left: glow.x,
            top: glow.y,
            width: glow.size,
            height: glow.size,
            background: glow.color,
            opacity: 0.14,
          }}
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 20, 0],
            opacity: [0.1, 0.18, 0.1],
          }}
          transition={{
            duration: glow.duration,
            delay: glow.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-surface/0 via-surface/40 to-surface" />
    </div>
  );
}
