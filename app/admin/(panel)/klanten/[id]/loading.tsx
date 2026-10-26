import { Skeleton } from "@/components/ui/skeleton";
import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/admin/TableSkeleton";

export default function Loading() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Skeleton className="h-4 w-36" />
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <TableSkeleton rows={5} cols={6} />
    </div>
  );
}
