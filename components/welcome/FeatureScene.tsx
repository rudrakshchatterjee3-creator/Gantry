"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { ReactNode } from "react";

interface FeatureSceneProps {
  eyebrow: string;
  title: string;
  description: string;
  reverse?: boolean;
  children: ReactNode;
}

// One scroll beat: copy on one side, a small looping motion-graphic on the
// other that demonstrates the feature mechanically (gate load bars rising,
// a chat bubble typing, a venue pin swapping) rather than describing it in
// prose alone. Reveal is scroll-triggered via useInView, not on a timer.
export function FeatureScene({ eyebrow, title, description, reverse, children }: FeatureSceneProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });

  return (
    <div
      ref={ref}
      className={`mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-20 md:gap-16 md:py-28 ${
        reverse ? "md:flex-row-reverse" : "md:flex-row"
      }`}
    >
      <motion.div
        className="flex-1"
        initial={{ opacity: 0, x: reverse ? 24 : -24 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-broadcast">{eyebrow}</p>
        <h3 className="mt-3 font-display text-2xl font-bold text-floodlight sm:text-3xl">{title}</h3>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">{description}</p>
      </motion.div>

      <motion.div
        className="flex flex-1 items-center justify-center"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
