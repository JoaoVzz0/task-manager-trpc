"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Task } from "@/lib/task.schema";
import { getErrorMessage, isNotFoundError } from "@/lib/trpc-error";
import { useTRPC } from "@/trpc/client";

/**
 * Deletes a task after an explicit confirmation. The dialog stays open while
 * the request runs, so the pending state is visible and a failure can be
 * retried without starting over.
 */
export function DeleteTaskButton({
  task,
}: {
  task: Pick<Task, "id" | "title">;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Refetches every loaded page, so the list closes the gap left by the task.
  const refreshList = () =>
    queryClient.invalidateQueries(trpc.task.list.pathFilter());

  const deleteTask = useMutation(
    trpc.task.delete.mutationOptions({
      // Awaiting the refetch keeps the mutation pending until the list is
      // updated, so the dialog closes and the card disappears together.
      onSuccess: async () => {
        await refreshList();
        setOpen(false);
        toast.success("Task deleted");
      },
      onError: async (error) => {
        if (isNotFoundError(error)) {
          // Already gone (deleted in another tab): nothing to retry.
          await refreshList();
          setOpen(false);
          toast.info("This task was already deleted");
          return;
        }
        // Keep the dialog open so the user can try again.
        toast.error(getErrorMessage(error));
      },
    }),
  );

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!deleteTask.isPending) setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete "${task.title}"`}
          disabled={deleteTask.isPending}
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
          <AlertDialogDescription className="break-words">
            &ldquo;{task.title}&rdquo; will be permanently deleted. This
            can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTask.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteTask.isPending}
            onClick={(event) => {
              // The default action closes the dialog immediately; it closes
              // on success instead.
              event.preventDefault();
              deleteTask.mutate({ id: task.id });
            }}
          >
            {deleteTask.isPending && <Spinner />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
