// Single source of truth for hex values Recharts needs — it renders to SVG
// and can't consume Tailwind utility classes, so these must be duplicated
// from tailwind.config.ts's color tokens. Keep in sync manually; every chart
// component should import from here instead of hardcoding its own hex.
export const CHART_COLORS = {
  normal: "#22C55E",
  warning: "#F5A623",
  critical: "#EF4444",
  broadcast: "#2DD4E8",
  grid: "#232A2E", // surface.border
  tooltipBg: "#161D21", // surface.raised
  axisText: "#64748b", // slate-500, matches existing axis label color
} as const;
