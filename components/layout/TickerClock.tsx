"use client";

import { useEffect, useState } from "react";

export function TickerClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-xs tabular-nums text-slate-400">
      {now ? now.toLocaleTimeString("en-US", { hour12: false }) : "--:--:--"}
      <span className="ml-1 text-slate-600">ET</span>
    </span>
  );
}
