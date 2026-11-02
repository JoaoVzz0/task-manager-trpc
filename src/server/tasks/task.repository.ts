import "server-only";

import type { Task, TaskCursor } from "@/lib/task.schema";
import { createSeedTasks } from "./task.seed";

export type TaskPage = {
  items: Task[];
  nextCursor: TaskCursor | null;
};

export type TaskChanges = Pick<Task, "title" | "description" | "updatedAt">;

/**
 * The seam between business rules and storage. Methods are async even though
 * the in-memory store is not, so swapping in a database changes no caller.
 */
export interface TaskRepository {
  findById(id: string): Promise<Task | undefined>;
  /**
   * Returns tasks newest first, starting after `cursor`.
   *
   * Keyset (cursor) pagination instead of offset: inserting or deleting between
   * page loads never duplicates or skips an item, and the cursor maps directly
   * to `WHERE (created_at, id) < ($1, $2) ORDER BY ... LIMIT` in SQL.
   */
  listPage(params: {
    limit: number;
    cursor?: TaskCursor | null;
  }): Promise<TaskPage>;
  insert(task: Task): Promise<Task>;
  update(id: string, changes: TaskChanges): Promise<Task | undefined>;
  delete(id: string): Promise<boolean>;
}

/**
 * Orders newest first. `id` breaks ties so the order is total, which is what
 * makes a cursor unambiguous when two tasks share the same createdAt.
 */
function compareNewestFirst(a: TaskCursor, b: TaskCursor): number {
  return (
    b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id)
  );
}

export function createInMemoryTaskRepository(
  initialTasks: Task[] = [],
): TaskRepository {
  const tasks = new Map(initialTasks.map((task) => [task.id, task]));

  return {
    async findById(id) {
      return tasks.get(id);
    },

    async listPage({ limit, cursor }) {
      const sorted = [...tasks.values()].sort(compareNewestFirst);
      const remaining = cursor
        ? sorted.filter((task) => compareNewestFirst(cursor, task) < 0)
        : sorted;

      // Fetch one extra row to know whether another page exists.
      const window = remaining.slice(0, limit + 1);
      const items = window.slice(0, limit);
      const last = items.at(-1);

      return {
        items,
        nextCursor:
          window.length > limit && last
            ? { createdAt: last.createdAt, id: last.id }
            : null,
      };
    },

    async insert(task) {
      tasks.set(task.id, task);
      return task;
    },

    async update(id, changes) {
      const existing = tasks.get(id);
      if (!existing) return undefined;

      const updated: Task = { ...existing, ...changes };
      tasks.set(id, updated);
      return updated;
    },

    async delete(id) {
      return tasks.delete(id);
    },
  };
}

const globalStore = globalThis as typeof globalThis & {
  __taskRepository?: TaskRepository;
};

/**
 * The process-wide store, seeded with sample tasks.
 *
 * Kept on globalThis because Next.js re-evaluates modules on HMR and can load
 * this one in more than one module graph (route handler vs. server components).
 * A module-level singleton would give each graph its own empty store.
 */
export const taskRepository: TaskRepository = (globalStore.__taskRepository ??=
  createInMemoryTaskRepository(createSeedTasks()));
