"use client";

import { motion } from "framer-motion";
import { GantryMark } from "@/components/brand/GantryLogo";

export function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <GantryMark className="mx-auto h-14 w-14" />
      </motion.div>

      <motion.h1
        className="mt-8 font-display text-5xl font-bold uppercase leading-[1.05] tracking-wide text-floodlight sm:text-7xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
      >
        Command every
        <br />
        <span className="text-broadcast">matchday</span>, live.
      </motion.h1>

      <motion.p
        className="mt-6 max-w-lg text-balance text-sm leading-relaxed text-slate-400 sm:text-base"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        GANTRY fuses live gate, transit, and weather signals with a GenAI concierge —
        across all 16 FIFA World Cup 2026 host venues.
      </motion.p>

      <motion.div
        className="mt-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45 }}
      >
        <a
          href="#sign-in"
          className="rounded-lg bg-floodlight px-6 py-3 font-sans text-sm font-semibold text-surface transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Sign in to GANTRY
        </a>
      </motion.div>

      <motion.div
        className="mt-20 flex flex-col items-center gap-2 text-slate-600"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <span className="h-8 w-px bg-slate-700" />
      </motion.div>
    </section>
  );
}
