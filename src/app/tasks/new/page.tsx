import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/tasks/task-form";

export const metadata: Metadata = { title: "New task" };

export default function NewTaskPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="New task" />
      <TaskForm />
    </div>
  );
}
