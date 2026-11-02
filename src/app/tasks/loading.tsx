import { PageHeader } from "@/components/page-header";
import { TaskListSkeleton } from "@/components/tasks/task-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown instantly on navigation while the page fetches on the server. The
 * header mirrors the real one so nothing jumps when the content arrives.
 */
export default function TasksLoading() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Tasks" action={<Skeleton className="h-9 w-28" />} />
      <TaskListSkeleton />
    </div>
  );
}
