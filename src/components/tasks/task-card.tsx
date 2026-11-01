import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { Task } from "@/lib/task.schema";

type TaskCardProps = {
  task: Task;
  // Slot for per-task controls, so this component stays presentational and the
  // list decides which interactive pieces to render.
  actions?: ReactNode;
};

function TaskTime({ date }: { date: Date }) {
  return <time dateTime={date.toISOString()}>{formatDateTime(date)}</time>;
}

export function TaskCard({ task, actions }: TaskCardProps) {
  const wasEdited = task.updatedAt.getTime() !== task.createdAt.getTime();

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="break-words">
          {task.title}
        </CardTitle>
        <CardDescription>
          Created <TaskTime date={task.createdAt} />
          {wasEdited && (
            <>
              {" · "}Edited <TaskTime date={task.updatedAt} />
            </>
          )}
        </CardDescription>
        {actions && <CardAction>{actions}</CardAction>}
      </CardHeader>
      {task.description && (
        <CardContent>
          {/* Rendered as text, never as HTML; pre-wrap keeps the user's line breaks. */}
          <p className="text-sm break-words whitespace-pre-wrap">
            {task.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
