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
  type TaskInput,
} from "@/lib/task.schema";
import { getErrorMessage, getFieldErrors } from "@/lib/trpc-error";
import { useTRPC } from "@/trpc/client";

function isFormField(field: string): field is keyof TaskInput {
  return Object.hasOwn(taskInputSchema.shape, field);
}

/**
 * Task form. Validates locally with the same schema the server uses, so most
 * mistakes never reach the network; errors the server still reports are shown
 * on their field or, when they belong to no field, above the form.
 */
export function TaskForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();

  const form = useForm<TaskInput>({
    resolver: zodResolver(taskInputSchema),
    defaultValues: { title: "", description: "" },
    mode: "onTouched",
  });

  const createTask = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: () => {
        // The list is not mounted on this page, so this only marks it stale:
        // whatever copy the browser still holds is refetched when shown again.
        void queryClient.invalidateQueries(trpc.task.list.pathFilter());
        toast.success("Task created");
        startNavigation(() => router.push("/tasks"));
      },
      onError: (error) => {
        for (const [field, message] of Object.entries(getFieldErrors(error))) {
          if (isFormField(field)) {
            form.setError(field, { type: "server", message });
          }
        }
      },
    }),
  );

  // Blocks a second submit before React re-renders the disabled button. A fast
  // double click would otherwise send two mutations, which the batch link
  // packs into one request, creating the task twice.
  const isSubmittingRef = useRef(false);

  function submit(values: TaskInput) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    createTask.mutate(values, {
      // On success the page navigates away, so the guard is only released
      // when the user has to submit again.
      onError: () => {
        isSubmittingRef.current = false;
      },
    });
  }

  // Field-level server errors are already shown on their fields.
  const formError =
    createTask.isError &&
    Object.keys(getFieldErrors(createTask.error)).length === 0
      ? getErrorMessage(createTask.error)
      : null;

  // Stays busy until the next page takes over, so a second click cannot
  // submit the same task twice.
  const isBusy = createTask.isPending || isNavigating;

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
            <Button type="submit" disabled={isBusy}>
              {isBusy && <Spinner />}
              {isBusy ? "Creating…" : "Create task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
