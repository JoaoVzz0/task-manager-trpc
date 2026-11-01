import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Task, TaskCursor } from "@/lib/task.schema";
import { NotFoundError } from "@/server/errors";
import { createInMemoryTaskRepository } from "@/server/tasks/task.repository";
import {
  createTaskService,
  type TaskService,
} from "@/server/tasks/task.service";

const UNKNOWN_ID = "11111111-1111-4111-8111-111111111111";

function task(id: string, createdAtMs: number): Task {
  const createdAt = new Date(createdAtMs);
  return { id, title: id, createdAt, updatedAt: createdAt };
}

// Follows nextCursor until it runs out, like the infinite list does. A broken
// cursor that never advances would loop forever, so cap the pages and fail fast.
const MAX_PAGES = 100;

async function readAllPages(service: TaskService, limit: number) {
  const pages: string[][] = [];
  let cursor: TaskCursor | null = null;
  do {
    if (pages.length >= MAX_PAGES) {
      throw new Error(
        "Pagination did not terminate: the cursor never advanced",
      );
    }
    const page = await service.list({ limit, cursor });
    pages.push(page.items.map((item) => item.id));
    cursor = page.nextCursor;
  } while (cursor);
  return pages;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("task service", () => {
  describe("create", () => {
    it("assigns an id and equal timestamps", async () => {
      vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
      const service = createTaskService(createInMemoryTaskRepository());

      const created = await service.create({ title: "Write docs" });

      expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(created.createdAt).toEqual(new Date("2026-01-01T10:00:00Z"));
      expect(created.updatedAt).toEqual(created.createdAt);
      expect(await service.getById(created.id)).toEqual(created);
    });

    it("stores an empty description as no description", async () => {
      const service = createTaskService(createInMemoryTaskRepository());

      const created = await service.create({ title: "A", description: "" });

      expect(created.description).toBeUndefined();
    });
  });

  describe("update", () => {
    it("replaces the fields, keeps id and createdAt, bumps updatedAt", async () => {
      const service = createTaskService(createInMemoryTaskRepository());
      vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
      const created = await service.create({ title: "A", description: "old" });

      vi.setSystemTime(new Date("2026-01-01T11:00:00Z"));
      const updated = await service.update({ id: created.id, title: "B" });

      expect(updated).toMatchObject({
        id: created.id,
        title: "B",
        description: undefined,
        createdAt: created.createdAt,
        updatedAt: new Date("2026-01-01T11:00:00Z"),
      });
    });
  });

  describe("unknown ids", () => {
    it("throws NotFoundError from getById, update and delete", async () => {
      const service = createTaskService(createInMemoryTaskRepository());
      const message = `Task "${UNKNOWN_ID}" not found`;

      await expect(service.getById(UNKNOWN_ID)).rejects.toThrow(message);
      await expect(
        service.update({ id: UNKNOWN_ID, title: "x" }),
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(service.delete(UNKNOWN_ID)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it("throws on the second delete of the same task", async () => {
      const service = createTaskService(createInMemoryTaskRepository());
      const created = await service.create({ title: "A" });

      await service.delete(created.id);

      await expect(service.delete(created.id)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe("cursor pagination", () => {
    const tasks = Array.from({ length: 25 }, (_, i) => task(`t${i}`, i * 1000));

    it("walks every task exactly once and ends with no cursor", async () => {
      const service = createTaskService(createInMemoryTaskRepository(tasks));

      const pages = await readAllPages(service, 10);

      expect(pages.map((page) => page.length)).toEqual([10, 10, 5]);
      expect(new Set(pages.flat()).size).toBe(25);
    });

    it("does not add an empty page when the total is a multiple of the limit", async () => {
      const service = createTaskService(
        createInMemoryTaskRepository(tasks.slice(0, 20)),
      );

      const pages = await readAllPages(service, 10);

      expect(pages.map((page) => page.length)).toEqual([10, 10]);
    });

    it("does not skip items when the cursor task is deleted between pages", async () => {
      const service = createTaskService(
        createInMemoryTaskRepository(tasks.slice(0, 6)),
      );
      const first = await service.list({ limit: 3 });
      if (!first.nextCursor) throw new Error("expected a second page");

      // The cursor points at the last item of the first page.
      await service.delete(first.nextCursor.id);
      const second = await service.list({ limit: 3, cursor: first.nextCursor });

      expect(second.items.map((item) => item.id)).toEqual(["t2", "t1", "t0"]);
    });

    it("does not repeat items when a newer task is created between pages", async () => {
      const repository = createInMemoryTaskRepository(tasks.slice(0, 6));
      const service = createTaskService(repository);
      const first = await service.list({ limit: 3 });

      await repository.insert(task("newest", 999_999));
      const second = await service.list({ limit: 3, cursor: first.nextCursor });

      expect(second.items.map((item) => item.id)).toEqual(["t2", "t1", "t0"]);
    });

    it("keeps a stable order for tasks created at the same instant", async () => {
      const sameInstant = [task("a", 5), task("b", 5), task("c", 5)];
      const service = createTaskService(
        createInMemoryTaskRepository(sameInstant),
      );

      const pages = await readAllPages(service, 1);

      expect(pages.flat().sort()).toEqual(["a", "b", "c"]);
    });
  });
});
