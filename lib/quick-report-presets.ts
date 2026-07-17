import type { SeverityLevel } from "@/lib/types";

// --- Quick Report Presets -----------------------------------------------------
// Fixed, server-known categories a gate steward can tap on the public
// /report/[venueId]/[gateId] page (no login — a steward standing at a gate
// on matchday won't be signed into the ops dashboard). Deliberately NOT
// free text: constraining input to these 4 enum values means the public
// endpoint can never be used to inject arbitrary text into the LLM prompt
// or spam it with junk, while still producing a real, useful report that
// runs through the full AI pipeline.

export interface QuickReportPreset {
  id: string;
  label: string;
  description: string;
  severityHint: SeverityLevel;
  reportTemplate: (gateLabel: string) => string;
}

export const QUICK_REPORT_PRESETS: QuickReportPreset[] = [
  {
    id: "bottleneck",
    label: "Bottleneck / Long Line",
    description: "Crowd backing up, slow entry",
    severityHint: "warning",
    reportTemplate: (gateLabel) => `Gate steward report — ${gateLabel}: bottleneck, long line forming, crowd backing up.`,
  },
  {
    id: "equipment",
    label: "Broken Equipment",
    description: "Scanner, turnstile, or gate malfunction",
    severityHint: "warning",
    reportTemplate: (gateLabel) => `Gate steward report — ${gateLabel}: broken scanner/turnstile, equipment malfunction.`,
  },
  {
    id: "medical",
    label: "Medical Emergency",
    description: "Injury or medical attention needed",
    severityHint: "critical",
    reportTemplate: (gateLabel) => `Gate steward report — ${gateLabel}: medical emergency, injury, needs immediate attention.`,
  },
  {
    id: "security",
    label: "Security Concern",
    description: "Altercation, suspicious activity, crush risk",
    severityHint: "critical",
    reportTemplate: (gateLabel) => `Gate steward report — ${gateLabel}: security concern, crowd crush risk, needs immediate attention.`,
  },
];

export function getQuickReportPreset(id: string): QuickReportPreset | null {
  return QUICK_REPORT_PRESETS.find((p) => p.id === id) ?? null;
}
