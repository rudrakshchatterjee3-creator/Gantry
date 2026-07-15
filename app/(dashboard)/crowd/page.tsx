import { ThroughputChartLazy } from "@/components/dashboard/ThroughputChartLazy";
import { ConcourseTrafficChartLazy } from "@/components/crowd/ConcourseTrafficChartLazy";
import { WaitTimeTable } from "@/components/crowd/WaitTimeTable";

export default function CrowdFlowPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-lg font-bold uppercase tracking-wide text-slate-100">Crowd Flow</h1>
        <p className="text-sm text-slate-500">
          Turnstile throughput and concourse congestion trends across the stadium.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <ThroughputChartLazy />
          <ConcourseTrafficChartLazy />
        </div>
        <div className="xl:col-span-1">
          <WaitTimeTable />
        </div>
      </div>
    </div>
  );
}
