import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/admin/TableSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={10} cols={7} />
    </div>
  );
}
