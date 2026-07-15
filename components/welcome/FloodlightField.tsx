"use client";

import { motion } from "framer-motion";

// Ambient background: soft drifting floodlight glows + a faint gantry-truss
// grid, echoing the brand mark without repeating the logo itself. Pure CSS/
// SVG, no images, so it's cheap and themeable.
const GLOWS = [
  { x: "10%", y: "15%", size: 420, color: "#2DD4E8", duration: 22, delay: 0 },
  { x: "78%", y: "8%", size: 340, color: "#22C55E", duration: 26, delay: 2 },
  { x: "85%", y: "70%", size: 480, color: "#2DD4E8", duration: 30, delay: 4 },
  { x: "15%", y: "78%", size: 360, color: "#F5A623", duration: 24, delay: 1 },
  { x: "48%", y: "45%", size: 300, color: "#2DD4E8", duration: 20, delay: 3 },
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
          className="absolute rounded-full blur-3xl"
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
