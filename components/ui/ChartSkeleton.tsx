export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-panel p-4">
      <div className="mb-3 h-4 w-40 animate-pulse rounded bg-surface-raised" />
      <div className="animate-pulse rounded bg-surface-raised" style={{ height }} />
    </div>
  );
}
