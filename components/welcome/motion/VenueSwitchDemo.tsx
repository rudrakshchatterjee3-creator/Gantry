"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

const VENUES = [
  { name: "MetLife Stadium", city: "East Rutherford, NJ" },
  { name: "SoFi Stadium", city: "Inglewood, CA" },
  { name: "Estadio Azteca", city: "Mexico City, MX" },
  { name: "BC Place", city: "Vancouver, CA" },
];

export function VenueSwitchDemo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % VENUES.length), 2200);
    return () => clearInterval(id);
  }, []);

  const venue = VENUES[index];

  return (
    <div className="w-full max-w-sm rounded-xl border border-surface-border bg-surface-panel p-6 shadow-2xl shadow-black/40">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-slate-500">16 Host Venues</span>
        <span className="font-mono text-[11px] text-broadcast">{index + 1} / 16</span>
      </div>

      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-md bg-surface-raised">
        <AnimatePresence mode="wait">
          <motion.div
            key={venue.name}
            className="flex flex-col items-center gap-2 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <MapPin size={18} className="text-broadcast" />
            <span className="font-display text-sm font-bold text-floodlight">{venue.name}</span>
            <span className="font-mono text-[11px] text-slate-500">{venue.city}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex justify-center gap-1.5">
        {VENUES.map((v, i) => (
          <span
            key={v.name}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-4 bg-broadcast" : "w-1.5 bg-surface-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
