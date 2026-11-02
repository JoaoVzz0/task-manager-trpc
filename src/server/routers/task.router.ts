import "server-only";

import {
  listTasksSchema,
  taskIdSchema,
  taskInputSchema,
  updateTaskSchema,
} from "@/lib/task.schema";
import { publicProcedure, router } from "../trpc";

/** Task procedures. They only validate input and delegate to the service. */
export const taskRouter = router({
  list: publicProcedure
    .input(listTasksSchema)
    .query(({ ctx, input }) => ctx.taskService.list(input)),

  byId: publicProcedure
    .input(taskIdSchema)
    .query(({ ctx, input }) => ctx.taskService.getById(input.id)),

  create: publicProcedure
    .input(taskInputSchema)
    .mutation(({ ctx, input }) => ctx.taskService.create(input)),

  update: publicProcedure
    .input(updateTaskSchema)
    .mutation(({ ctx, input }) => ctx.taskService.update(input)),

  delete: publicProcedure
    .input(taskIdSchema)
    .mutation(({ ctx, input }) => ctx.taskService.delete(input.id)),
});
