"use client";

import { motion } from "framer-motion";

const GATES = [
  { label: "N", peak: 78 },
  { label: "E", peak: 45 },
  { label: "S", peak: 92 },
  { label: "W", peak: 60 },
];

export function GateLoadDemo() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-surface-border bg-surface-panel p-6 shadow-2xl shadow-black/40">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-slate-500">Gate Load</span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-normal">
          <span className="h-1.5 w-1.5 rounded-full bg-normal" />
          live model
        </span>
      </div>
      <div className="flex h-40 items-end justify-between gap-4">
        {GATES.map((gate, i) => (
          <div key={gate.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative flex h-32 w-full items-end overflow-hidden rounded-md bg-surface-raised">
              <motion.div
                className="w-full rounded-md bg-gradient-to-t from-broadcast to-broadcast/40"
                initial={{ height: "10%" }}
                animate={{ height: [`${gate.peak - 25}%`, `${gate.peak}%`, `${gate.peak - 15}%`] }}
                transition={{
                  duration: 4.5,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                }}
              />
            </div>
            <span className="font-mono text-[11px] text-slate-500">Gate {gate.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
