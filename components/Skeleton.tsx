export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-input bg-surface-high ${className ?? ""}`} />;
}
