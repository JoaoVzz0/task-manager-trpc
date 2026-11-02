import { z } from "zod";

export const TASK_LIMITS = {
  titleMax: 120,
  descriptionMax: 1000,
  pageSizeMax: 50,
} as const;

/**
 * Page size of the task list. Shared by the server prefetch and the client
 * query: both must build the exact same input, otherwise the hydrated cache key
 * never matches and the client refetches the first page.
 */
export const TASKS_PAGE_SIZE = 10;

/**
 * Fields a user can write. Shared by the form resolver and the router input,
 * so the same rules run on both sides; the server never trusts what the client
 * already validated.
 */
export const taskInputSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(
      TASK_LIMITS.titleMax,
      `Title must be at most ${TASK_LIMITS.titleMax} characters`,
    ),
  description: z
    .string()
    .trim()
    .max(
      TASK_LIMITS.descriptionMax,
      `Description must be at most ${TASK_LIMITS.descriptionMax} characters`,
    )
    .optional(),
});
export type TaskInput = z.infer<typeof taskInputSchema>;

export const taskSchema = taskInputSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Task = z.infer<typeof taskSchema>;

export const taskIdSchema = z.object({ id: z.uuid("Invalid task id") });

/**
 * Full replacement, not a partial patch: the form always submits every field.
 */
export const updateTaskSchema = taskIdSchema.extend(taskInputSchema.shape);
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskCursorSchema = z.object({
  createdAt: z.date(),
  id: z.uuid(),
});
export type TaskCursor = z.infer<typeof taskCursorSchema>;

export const listTasksSchema = z.object({
  limit: z.number().int().min(1).max(TASK_LIMITS.pageSizeMax),
  cursor: taskCursorSchema.nullish(),
});
export type ListTasksInput = z.infer<typeof listTasksSchema>;
