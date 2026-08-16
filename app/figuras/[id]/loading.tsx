import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-card border border-border bg-surface p-5">
      <Skeleton className="mb-5 h-6 w-48" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    </div>
  );
}
