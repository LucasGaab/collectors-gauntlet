export function Skeleton({ className }: { className?: string }) {
  return <div className={`shimmer rounded-input bg-surface-high ${className ?? ""}`} />;
}
