import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/admin/TableSkeleton";

export default function Loading() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Skeleton className="h-4 w-40" />
      <PageHeaderSkeleton />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
