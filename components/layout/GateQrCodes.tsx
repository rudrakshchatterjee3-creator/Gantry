"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";
import { useVenueStore } from "@/lib/store/useVenueStore";

const GATES: { id: string; label: string }[] = [
  { id: "gate-a", label: "North Gate" },
  { id: "gate-b", label: "South Gate" },
  { id: "gate-c", label: "East Gate" },
  { id: "gate-d", label: "West Gate" },
];

// Each QR encodes a real, working URL to the public /report/[venueId]/[gateId]
// quick-report page for the currently selected venue — print these and post
// one at each physical gate so a steward can scan and file a report in one
// tap, no login, no typing. Generated client-side (qrcode package) since it
// needs window.location.origin for a scannable absolute URL.
export function GateQrCodes() {
  const venue = useVenueStore((state) => state.selectedVenue);
  const [codes, setCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    Promise.all(
      GATES.map(async (gate) => {
        const url = `${window.location.origin}/report/${venue.id}/${gate.id}`;
        const dataUrl = await QRCode.toDataURL(url, { width: 160, margin: 1, color: { dark: "#0A0E12", light: "#EDF1F3" } });
        return [gate.id, dataUrl] as const;
      })
    ).then((entries) => {
      if (!cancelled) setCodes(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [venue.id]);

  return (
    <div className="rounded-lg border border-surface-border bg-surface-panel">
      <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
        <QrCode size={14} className="text-slate-400" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
          Gate Quick-Report Codes
        </h2>
      </div>
      <p className="px-4 pt-3 text-[11px] text-slate-500">
        Print and post at each physical gate — {venue.name}. Scanning opens a one-tap report page, no login
        required, straight into the Action Feed.
      </p>
      <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
        {GATES.map((gate) => (
          <div key={gate.id} className="flex flex-col items-center gap-2 rounded-md bg-surface-raised p-3">
            {codes[gate.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={codes[gate.id]} alt={`QR code to report an incident at ${gate.label}`} className="h-24 w-24 rounded" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded bg-surface text-[10px] text-slate-600">
                Generating…
              </div>
            )}
            <span className="text-[11px] font-medium text-slate-300">{gate.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
