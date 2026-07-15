import { VenueMapLazy } from "@/components/dashboard/VenueMapLazy";
import { StadiumGrid } from "@/components/dashboard/StadiumGrid";
import { ZoneTable } from "@/components/zones/ZoneTable";

export default function ZoneMonitorPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-lg font-bold uppercase tracking-wide text-slate-100">Zone Monitor</h1>
        <p className="text-sm text-slate-500">
          Live occupancy and flow across every gate and concourse sector.
        </p>
      </div>

      <VenueMapLazy />
      <StadiumGrid />
      <ZoneTable />
    </div>
  );
}
