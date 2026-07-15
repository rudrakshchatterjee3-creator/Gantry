import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // GANTRY palette — broadcast-control-room, not generic slate/zinc.
        // Same token keys as before (surface/critical/warning/normal) so
        // every existing className reference keeps working; only the
        // underlying hex values changed.
        surface: {
          DEFAULT: "#0A0E12", // midnight — blue-black base
          panel: "#10161A", // pitch — faint green-black undertone, turf-under-floodlights
          raised: "#161D21",
          border: "#232A2E",
        },
        critical: {
          DEFAULT: "#EF4444", // siren-red
          muted: "#EF44441a",
        },
        warning: {
          DEFAULT: "#F5A623", // floodlight-amber
          muted: "#F5A6231a",
        },
        normal: {
          DEFAULT: "#22C55E", // pitch-green
          muted: "#22C55E1a",
        },
        // The one non-severity accent: links, focus rings, active nav,
        // mic button, brand mark. Deliberately distinct from severity hues.
        broadcast: {
          DEFAULT: "#2DD4E8",
          muted: "#2DD4E81a",
        },
        floodlight: "#EDF1F3", // primary text default (warm-white, not pure white)
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      animation: {
        "pulse-critical": "pulse-critical 1.6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-critical": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.45)" },
          "50%": { boxShadow: "0 0 0 8px rgba(239, 68, 68, 0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
