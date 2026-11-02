import { TaskFormPageSkeleton } from "@/components/tasks/task-form-skeleton";

/**
 * Overrides the list skeleton from app/tasks/loading.tsx, which would
 * otherwise also apply to this child route.
 */
export default function NewTaskLoading() {
  return <TaskFormPageSkeleton title="New task" />;
}
