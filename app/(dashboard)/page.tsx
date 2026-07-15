"use client";

import { MetricsHeader } from "@/components/dashboard/MetricsHeader";
import { VenueHero } from "@/components/dashboard/VenueHero";
import { VenueMapLazy } from "@/components/dashboard/VenueMapLazy";
import { StadiumGrid } from "@/components/dashboard/StadiumGrid";
import { ThroughputChartLazy } from "@/components/dashboard/ThroughputChartLazy";
import { AIActionFeed } from "@/components/dashboard/AIActionFeed";

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col gap-6">
      <VenueHero />
      <MetricsHeader />

      <div className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <VenueMapLazy />
          <StadiumGrid />
          <ThroughputChartLazy />
        </div>
        <div className="xl:col-span-1">
          <AIActionFeed />
        </div>
      </div>
    </div>
  );
}
