"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { GATE_DENSITY_WARNING, GATE_DENSITY_CRITICAL } from "@/lib/mock-iot";
import { useAmbientTelemetry } from "@/lib/store/useAmbientTelemetry";
import { CHART_COLORS } from "@/lib/ui/chart-colors";

function colorFor(pct: number): string {
  if (pct >= GATE_DENSITY_CRITICAL) return CHART_COLORS.critical;
  if (pct >= GATE_DENSITY_WARNING) return CHART_COLORS.warning;
  return CHART_COLORS.normal;
}

export function ConcourseTrafficChart() {
  const readings = useAmbientTelemetry((state) => state.readings);

  const data = readings.map((r) => ({
    name: r.zoneName.replace("Concourse ", ""),
    traffic: r.concourseTrafficPct,
  }));

  return (
    <div className="rounded-lg border border-surface-border bg-surface-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
          Concourse Traffic by Zone
        </h2>
        <span className="font-mono text-[11px] text-slate-500">% of max flow capacity</span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: CHART_COLORS.axisText }}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: CHART_COLORS.axisText }}
            axisLine={false}
            tickLine={false}
            width={40}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.tooltipBg,
              border: `1px solid ${CHART_COLORS.grid}`,
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: "#94a3b8" }}
            cursor={{ fill: "#ffffff08" }}
          />
          <Bar dataKey="traffic" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={colorFor(entry.traffic)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
