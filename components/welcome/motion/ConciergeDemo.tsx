"use client";

import { motion } from "framer-motion";
import { Mic } from "lucide-react";

const QUESTION = "Where's the nearest accessible gate?";
const ANSWER = "Gate S has a ramp entrance and is 4 min from your section.";

export function ConciergeDemo() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-surface-border bg-surface-panel p-5 shadow-2xl shadow-black/40">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-broadcast-muted text-broadcast">
          <Mic size={12} />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wide text-slate-500">Ask Gantry</span>
      </div>

      <div className="flex flex-col gap-3">
        <motion.div
          className="ml-auto max-w-[80%] rounded-lg rounded-br-sm bg-surface-raised px-3 py-2 text-xs text-slate-300"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 1, 0], y: [8, 0, 0, 0, -8] }}
          transition={{ duration: 6, times: [0, 0.08, 0.4, 0.92, 1], repeat: Infinity }}
        >
          {QUESTION}
        </motion.div>

        <motion.div
          className="mr-auto max-w-[85%] rounded-lg rounded-bl-sm bg-broadcast-muted px-3 py-2 text-xs text-floodlight"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 0, 1, 1, 0], y: [8, 8, 0, 0, -8] }}
          transition={{ duration: 6, times: [0, 0.35, 0.5, 0.92, 1], repeat: Infinity }}
        >
          {ANSWER}
        </motion.div>
      </div>
    </div>
  );
}
