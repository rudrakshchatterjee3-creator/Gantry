import type { Metadata } from "next";
import { Big_Shoulders, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font — no render-blocking external font requests, no
// silent fallback to system fonts (the previous CSS-variable-only approach
// declared "Inter"/"JetBrains Mono" without ever loading them).
const displayFont = Big_Shoulders({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const sansFont = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GANTRY — Matchday Operations | FIFA World Cup 2026",
  description: "Matchday operations and fan concierge across all 16 FIFA World Cup 2026 host venues.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
