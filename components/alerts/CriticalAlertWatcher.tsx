"use client";

import { useEffect, useRef, useState } from "react";
import { Siren, X } from "lucide-react";
import { useStadiumStore } from "@/lib/store/useStadiumStore";
import { getVenueById } from "@/lib/external/venues";
import type { AnomalyResolution } from "@/lib/types";

interface ToastState {
  resolution: AnomalyResolution;
  venueName: string;
}

// --- Critical Alert Watcher ---------------------------------------------------
// Watches every venue's resolutions (not just whichever one is currently
// selected) — a FIFA official looking at MetLife's dashboard should still be
// alerted the instant SoFi logs a critical incident, since incidents no
// longer get wiped out by switching venues (see useStadiumStore's
// resolutionsByVenue). For newly-added "High" severity items this:
//   1. Plays a short synthesized alert tone (Web Audio API — no audio file
//      to ship or license) so it's audible even if the tab isn't focused.
//   2. Fires a browser Notification (if permission granted) so it surfaces
//      even if the dashboard tab isn't the active one.
//   3. Shows an in-app toast as a fallback/reinforcement for both.
// Mounted once in the dashboard layout, entirely independent of which page
// is currently open.

function playAlertTone() {
  if (typeof window === "undefined") return;
  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  const ctx = new AudioContextCtor();
  const now = ctx.currentTime;

  [0, 0.18].forEach((offset) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.15);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.16);
  });

  setTimeout(() => ctx.close(), 500);
}

export function CriticalAlertWatcher() {
  const resolutionsByVenue = useStadiumStore((state) => state.resolutionsByVenue);
  const seenIds = useRef<Set<string>>(new Set());
  const isFirstRun = useRef(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const allResolutions = Object.entries(resolutionsByVenue).flatMap(([venueId, list]) =>
      list.map((resolution) => ({ resolution, venueId }))
    );

    // Skip alerting for whatever's already in the store on first mount
    // (e.g. after a page navigation) — only new arrivals should alert.
    if (isFirstRun.current) {
      allResolutions.forEach(({ resolution }) => seenIds.current.add(resolution.id));
      isFirstRun.current = false;
      return;
    }

    for (const { resolution, venueId } of allResolutions) {
      if (seenIds.current.has(resolution.id)) continue;
      seenIds.current.add(resolution.id);

      if (resolution.sop.severity === "High" && resolution.status === "open") {
        const venueName = getVenueById(venueId).name;
        playAlertTone();
        setToast({ resolution, venueName });

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(`GANTRY — Critical at ${venueName}: ${resolution.normalized.zoneLabel}`, {
            body: resolution.sop.dispatch,
            tag: resolution.id,
          });
        }
      }
    }
  }, [resolutionsByVenue]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed right-6 top-6 z-[60] flex w-80 items-start gap-3 rounded-lg border border-critical/40 bg-surface-panel p-4 shadow-2xl animate-pulse-critical">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-critical-muted text-critical">
        <Siren size={16} />
      </span>
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-critical">
          Critical — {toast.venueName}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-100">{toast.resolution.normalized.zoneLabel}</p>
        <p className="mt-0.5 text-xs text-slate-400">{toast.resolution.sop.dispatch}</p>
      </div>
      <button
        onClick={() => setToast(null)}
        className="shrink-0 text-slate-500 hover:text-slate-200"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
