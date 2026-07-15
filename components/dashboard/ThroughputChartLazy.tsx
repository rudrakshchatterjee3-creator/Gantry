"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";

// Recharts is a heavy client-only dependency; loading it via next/dynamic
// with ssr:false defers its parse/hydration cost and shows an immediate
// lightweight skeleton instead of blocking on it.
export const ThroughputChartLazy = dynamic(
  () => import("@/components/dashboard/ThroughputChart").then((mod) => mod.ThroughputChart),
  { ssr: false, loading: () => <ChartSkeleton height={220} /> }
);
