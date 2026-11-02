"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  TASK_LIMITS,
  taskInputSchema,
  type Task,
  type TaskInput,
} from "@/lib/task.schema";
import {
  getErrorMessage,
  getFieldErrors,
  isNotFoundError,
} from "@/lib/trpc-error";
import { useTRPC } from "@/trpc/client";

function isFormField(field: string): field is keyof TaskInput {
  return Object.hasOwn(taskInputSchema.shape, field);
}

type TaskFormProps = {
  /** When given, the form edits this task; otherwise it creates a new one. */
  task?: Task;
};

/**
 * Create and edit form. Validates locally with the same schema the server uses,
 * so most mistakes never reach the network; errors the server still reports are
 * shown on their field or, when they belong to no field, above the form.
 */
export function TaskForm({ task }: TaskFormProps) {
  const isEditing = task !== undefined;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();

  const form = useForm<TaskInput>({
    resolver: zodResolver(taskInputSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
    },
    mode: "onTouched",
  });

  function backToList() {
    // The list is not mounted on this page, so this only marks it stale:
    // whatever copy the browser still holds is refetched when shown again.
    void queryClient.invalidateQueries(trpc.task.list.pathFilter());
    startNavigation(() => router.push("/tasks"));
  }

  function handleSaveError(error: unknown) {
    if (isNotFoundError(error)) {
      // Deleted elsewhere while being edited: there is nothing left to save.
      toast.error("This task no longer exists");
      backToList();
      return;
    }
    for (const [field, message] of Object.entries(getFieldErrors(error))) {
      if (isFormField(field)) {
        form.setError(field, { type: "server", message });
      }
    }
  }

  const createTask = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: () => {
        toast.success("Task created");
        backToList();
      },
      onError: handleSaveError,
    }),
  );
  const updateTask = useMutation(
    trpc.task.update.mutationOptions({
      onSuccess: () => {
        toast.success("Task updated");
        backToList();
      },
      onError: handleSaveError,
    }),
  );
  const saveTask = isEditing ? updateTask : createTask;

  // Blocks a second submit before React re-renders the disabled button. A fast
  // double click would otherwise send two mutations, which the batch link
  // packs into one request, saving the task twice.
  const isSubmittingRef = useRef(false);

  function submit(values: TaskInput) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    // On success the page navigates away, so the guard is only released when
    // the user has to submit again.
    const releaseOnError = {
      onError: () => {
        isSubmittingRef.current = false;
      },
    };
    if (task) {
      updateTask.mutate({ id: task.id, ...values }, releaseOnError);
    } else {
      createTask.mutate(values, releaseOnError);
    }
  }

  // Field-level errors are already shown on their fields, and a missing task
  // already sent the user back to the list.
  const formError =
    saveTask.isError &&
    !isNotFoundError(saveTask.error) &&
    Object.keys(getFieldErrors(saveTask.error)).length === 0
      ? getErrorMessage(saveTask.error)
      : null;

  // Stays busy until the next page takes over, so a second click cannot
  // submit the same task twice.
  const isBusy = saveTask.isPending || isNavigating;
  // Saving an untouched task would only bump its updatedAt.
  const canSubmit = !isBusy && (!isEditing || form.formState.isDirty);

  let submitLabel = isEditing ? "Save changes" : "Create task";
  if (isBusy) submitLabel = isEditing ? "Saving…" : "Creating…";

  return (
    <Card>
      <CardContent>
        <form
          noValidate
          className="grid gap-6"
          onSubmit={form.handleSubmit(submit)}
        >
          {formError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Could not save the task</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <FieldSet disabled={isBusy}>
            <FieldGroup>
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="task-title">Title</FieldLabel>
                    <Input
                      {...field}
                      id="task-title"
                      autoComplete="off"
                      maxLength={TASK_LIMITS.titleMax}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="task-description">
                      Description
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      id="task-description"
                      rows={5}
                      maxLength={TASK_LIMITS.descriptionMax}
                      aria-invalid={fieldState.invalid}
                      aria-describedby="task-description-count"
                    />
                    <FieldDescription id="task-description-count">
                      {(field.value ?? "").length}/{TASK_LIMITS.descriptionMax}
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>

          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href="/tasks">Cancel</Link>
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isBusy && <Spinner />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
