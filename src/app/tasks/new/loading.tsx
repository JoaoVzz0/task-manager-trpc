import { PageHeader } from "@/components/page-header";
import { TaskFormSkeleton } from "@/components/tasks/task-form-skeleton";

/**
 * Overrides the list skeleton from app/tasks/loading.tsx, which would
 * otherwise also apply to this child route.
 */
export default function NewTaskLoading() {
  return (
    <div className="grid gap-6">
      <PageHeader title="New task" />
      <TaskFormSkeleton />
    </div>
  );
}
