import "server-only";

import type {
  ListTasksInput,
  Task,
  TaskInput,
  UpdateTaskInput,
} from "@/lib/task.schema";
import { NotFoundError } from "../errors";
import {
  taskRepository,
  type TaskPage,
  type TaskRepository,
} from "./task.repository";

// An empty description is stored as "no description", so callers never have to
// tell "" and undefined apart.
function normalizeDescription(description: string | undefined) {
  return description || undefined;
}

// Takes the repository as a parameter (not a container, just an argument) so
// tests can run against a fresh store.
export function createTaskService(repository: TaskRepository) {
  return {
    list(input: ListTasksInput): Promise<TaskPage> {
      return repository.listPage(input);
    },

    async getById(id: string): Promise<Task> {
      const task = await repository.findById(id);
      if (!task) throw new NotFoundError("Task", id);
      return task;
    },

    create(input: TaskInput): Promise<Task> {
      const now = new Date();
      return repository.insert({
        id: crypto.randomUUID(),
        title: input.title,
        description: normalizeDescription(input.description),
        createdAt: now,
        updatedAt: now,
      });
    },

    // Full replacement: an omitted description clears the stored one.
    async update(input: UpdateTaskInput): Promise<Task> {
      const updated = await repository.update(input.id, {
        title: input.title,
        description: normalizeDescription(input.description),
        updatedAt: new Date(),
      });
      if (!updated) throw new NotFoundError("Task", input.id);
      return updated;
    },

    async delete(id: string): Promise<void> {
      const deleted = await repository.delete(id);
      if (!deleted) throw new NotFoundError("Task", id);
    },
  };
}

export type TaskService = ReturnType<typeof createTaskService>;

export const taskService = createTaskService(taskRepository);
