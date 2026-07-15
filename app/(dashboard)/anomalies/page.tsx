import { AnomalyLog } from "@/components/anomalies/AnomalyLog";

export default function AnomaliesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-lg font-bold uppercase tracking-wide text-slate-100">Anomalies</h1>
        <p className="text-sm text-slate-500">
          Full history of AI-resolved anomalies from the Normalizer → Forecaster → Action Engine chain.
        </p>
      </div>

      <AnomalyLog />
    </div>
  );
}
