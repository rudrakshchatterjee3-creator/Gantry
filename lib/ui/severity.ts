import { AlertTriangle, Siren, ShieldAlert, ShieldCheck, ShieldQuestion, type LucideIcon } from "lucide-react";
import type { SeverityLevel } from "@/lib/types";

// Single source of truth for severity-driven styling. Previously this same
// object was hand-copied across AIActionFeed, AnomalyLog, and (in spirit)
// DispatchTable/ZoneTable/StadiumGrid/SecurityOverview — any palette change
// meant editing 5+ files in lockstep. Now it's one import.

type IconType = LucideIcon;

export type SopSeverity = "High" | "Medium" | "Low";

interface SopSeverityStyle {
  icon: IconType;
  text: string;
  bg: string;
  border: string;
  badge: string;
}

export const SOP_SEVERITY_STYLES: Record<SopSeverity, SopSeverityStyle> = {
  High: {
    icon: Siren,
    text: "text-critical",
    bg: "bg-critical-muted",
    border: "border-critical/30",
    badge: "bg-critical text-white",
  },
  Medium: {
    icon: AlertTriangle,
    text: "text-warning",
    bg: "bg-warning-muted",
    border: "border-warning/30",
    badge: "bg-warning text-black",
  },
  Low: {
    icon: AlertTriangle,
    text: "text-slate-400",
    bg: "bg-surface-raised",
    border: "border-surface-border",
    badge: "bg-surface-raised text-slate-300",
  },
};

export function sopSeverityStyle(severity: string | undefined): SopSeverityStyle {
  return SOP_SEVERITY_STYLES[severity as SopSeverity] ?? SOP_SEVERITY_STYLES.Low;
}

interface ZoneSeverityStyle {
  text: string;
  bg: string;
  border: string;
  badge: string;
  dot: string;
  tile: string; // full tile background+border combo, for the StadiumGrid heatmap
  ring: string;
}

export const ZONE_SEVERITY_STYLES: Record<SeverityLevel, ZoneSeverityStyle> = {
  normal: {
    text: "text-normal",
    bg: "bg-normal-muted",
    border: "border-normal/30",
    badge: "bg-normal-muted text-normal border-normal/30",
    dot: "bg-normal",
    tile: "border-normal/30 bg-normal-muted",
    ring: "",
  },
  warning: {
    text: "text-warning",
    bg: "bg-warning-muted",
    border: "border-warning/40",
    badge: "bg-warning-muted text-warning border-warning/30",
    dot: "bg-warning",
    tile: "border-warning/40 bg-warning-muted",
    ring: "",
  },
  critical: {
    text: "text-critical",
    bg: "bg-critical-muted",
    border: "border-critical/50",
    badge: "bg-critical-muted text-critical border-critical/30",
    dot: "bg-critical animate-pulse",
    tile: "border-critical/50 bg-critical-muted animate-pulse-critical",
    ring: "ring-1 ring-critical/40",
  },
};

export const THREAT_LEVEL_META: Record<SeverityLevel, { label: string; icon: IconType }> = {
  normal: { label: "Normal", icon: ShieldCheck },
  warning: { label: "Elevated", icon: ShieldQuestion },
  critical: { label: "Critical", icon: ShieldAlert },
};
