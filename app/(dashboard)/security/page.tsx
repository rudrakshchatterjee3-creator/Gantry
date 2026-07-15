import { SecurityOverview } from "@/components/security/SecurityOverview";

export default function SecurityPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-lg font-bold uppercase tracking-wide text-slate-100">Security</h1>
        <p className="text-sm text-slate-500">
          Threat level, derived from live crowd-density readings across every gate.
        </p>
      </div>

      <SecurityOverview />
    </div>
  );
}
