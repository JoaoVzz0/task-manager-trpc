import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { getQueryClient, trpc } from "@/trpc/server";

export const metadata: Metadata = { title: "Edit task" };

type EditTaskPageProps = {
  params: Promise<{ taskId: string }>;
};

/**
 * Loads the task in-process. Unknown ids and malformed ones (which fail input
 * validation) both render the not-found page; any other error reaches the
 * error boundary.
 */
async function getTask(id: string) {
  try {
    return await getQueryClient().fetchQuery(
      trpc.task.byId.queryOptions({ id }),
    );
  } catch (error) {
    if (
      error instanceof TRPCError &&
      (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")
    ) {
      notFound();
    }
    throw error;
  }
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { taskId } = await params;
  // Passed as a prop: the task only seeds the form, so there is no client
  // cache to hydrate.
  const task = await getTask(taskId);

  return (
    <div className="grid gap-6">
      <PageHeader title="Edit task" />
      <TaskForm task={task} />
    </div>
  );
}
