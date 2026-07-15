"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useAmbientTelemetry } from "@/lib/store/useAmbientTelemetry";
import { CHART_COLORS } from "@/lib/ui/chart-colors";

interface ChartPoint {
  time: string;
  throughput: number;
}

const MAX_POINTS = 20;

export function ThroughputChart() {
  const readings = useAmbientTelemetry((state) => state.readings);
  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    if (readings.length === 0) return;
    const totalThroughput = readings.reduce((sum, r) => sum + r.turnstileThroughput, 0);
    const point: ChartPoint = {
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      throughput: totalThroughput,
    };
    setData((prev) => [...prev, point].slice(-MAX_POINTS));
  }, [readings]);

  return (
    <div className="rounded-lg border border-surface-border bg-surface-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
          Turnstile Throughput
        </h2>
        <span className="font-mono text-[11px] text-slate-500">people / min, all gates</span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="throughputFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.normal} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.normal} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: CHART_COLORS.axisText }}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: CHART_COLORS.axisText }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.tooltipBg,
              border: `1px solid ${CHART_COLORS.grid}`,
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Area
            type="monotone"
            dataKey="throughput"
            stroke={CHART_COLORS.normal}
            strokeWidth={2}
            fill="url(#throughputFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
