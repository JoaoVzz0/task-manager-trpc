import { TaskFormPageSkeleton } from "@/components/tasks/task-form-skeleton";

/**
 * Shown while the task loads on the server. Overrides the list skeleton from
 * app/tasks/loading.tsx, which would otherwise also apply to this child route.
 */
export default function EditTaskLoading() {
  return <TaskFormPageSkeleton title="Edit task" />;
}
