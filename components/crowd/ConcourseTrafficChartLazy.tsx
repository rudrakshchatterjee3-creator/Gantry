"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";

export const ConcourseTrafficChartLazy = dynamic(
  () => import("@/components/crowd/ConcourseTrafficChart").then((mod) => mod.ConcourseTrafficChart),
  { ssr: false, loading: () => <ChartSkeleton height={240} /> }
);
