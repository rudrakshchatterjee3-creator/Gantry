"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";

// MapLibre needs a real DOM/WebGL context — ssr:false avoids any
// server-render-time crash and defers its (fairly heavy) bundle until the
// browser actually needs it.
export const VenueMapLazy = dynamic(
  () => import("@/components/dashboard/VenueMap").then((mod) => mod.VenueMap),
  { ssr: false, loading: () => <ChartSkeleton height={360} /> }
);
