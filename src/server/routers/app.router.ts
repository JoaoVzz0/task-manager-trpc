import "server-only";

import { router } from "../trpc";
import { taskRouter } from "./task.router";

export const appRouter = router({
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
