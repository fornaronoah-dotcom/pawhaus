import { Skeleton } from "@/components/ui/skeleton";
import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/admin/TableSkeleton";

export default function Loading() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Skeleton className="h-4 w-40" />
      <PageHeaderSkeleton />
      <Skeleton className="h-28 w-full rounded-xl" />
      <TableSkeleton rows={6} cols={3} />
    </div>
  );
}
