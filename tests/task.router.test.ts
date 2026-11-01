import { describe, expect, it } from "vitest";
import { TASK_LIMITS } from "@/lib/task.schema";
import { POST } from "@/app/api/trpc/[trpc]/route";
import { appRouter } from "@/server/routers/app.router";
import { createInMemoryTaskRepository } from "@/server/tasks/task.repository";
import { createTaskService } from "@/server/tasks/task.service";
import { createCallerFactory } from "@/server/trpc";

const UNKNOWN_ID = "11111111-1111-4111-8111-111111111111";

// Each caller gets its own empty store, so tests never share state.
function createCaller() {
  return createCallerFactory(appRouter)({
    taskService: createTaskService(createInMemoryTaskRepository()),
  });
}

// Goes through the real HTTP handler, so it also covers the error formatter
// and the superjson envelope that createCaller bypasses.
function callOverHttp(path: string, input: unknown) {
  return POST(
    new Request(`http://localhost/api/trpc/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json: input }),
    }),
  );
}

describe("task router", () => {
  describe("validation", () => {
    it.each([
      ["an empty title", ""],
      ["a whitespace-only title", "   "],
    ])("rejects %s with BAD_REQUEST", async (_label, title) => {
      await expect(createCaller().task.create({ title })).rejects.toMatchObject(
        {
          code: "BAD_REQUEST",
          message: expect.stringContaining("Title is required"),
        },
      );
    });

    it("rejects a missing title with BAD_REQUEST", async () => {
      await expect(
        // @ts-expect-error simulates a client that bypasses the TypeScript types
        createCaller().task.create({}),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("Title is required"),
      });
    });

    it("rejects a title over the limit", async () => {
      const title = "a".repeat(TASK_LIMITS.titleMax + 1);

      await expect(createCaller().task.create({ title })).rejects.toMatchObject(
        { code: "BAD_REQUEST" },
      );
    });

    it("rejects a description over the limit", async () => {
      const description = "d".repeat(TASK_LIMITS.descriptionMax + 1);

      await expect(
        createCaller().task.create({ title: "ok", description }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a malformed id and an out-of-range page size", async () => {
      const caller = createCaller();

      await expect(caller.task.byId({ id: "abc" })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      await expect(
        caller.task.list({ limit: TASK_LIMITS.pageSizeMax + 1 }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("not found", () => {
    it("maps unknown ids to NOT_FOUND with a useful message", async () => {
      const caller = createCaller();
      const expected = {
        code: "NOT_FOUND",
        message: `Task "${UNKNOWN_ID}" not found`,
      };

      await expect(caller.task.byId({ id: UNKNOWN_ID })).rejects.toMatchObject(
        expected,
      );
      await expect(
        caller.task.update({ id: UNKNOWN_ID, title: "x" }),
      ).rejects.toMatchObject(expected);
      await expect(
        caller.task.delete({ id: UNKNOWN_ID }),
      ).rejects.toMatchObject(expected);
    });
  });

  describe("crud flow", () => {
    it("creates, lists, updates and deletes a task", async () => {
      const caller = createCaller();

      const created = await caller.task.create({
        title: "  Ship it  ",
        description: "first version",
      });
      expect(created.title).toBe("Ship it");
      expect((await caller.task.list({ limit: 10 })).items).toEqual([created]);

      const updated = await caller.task.update({
        id: created.id,
        title: "Shipped",
      });
      expect(updated.title).toBe("Shipped");
      expect(await caller.task.byId({ id: created.id })).toEqual(updated);

      await caller.task.delete({ id: created.id });
      expect((await caller.task.list({ limit: 10 })).items).toEqual([]);
    });
  });

  describe("over HTTP", () => {
    it("returns 400 with per-field errors the form can attach", async () => {
      const response = await callOverHttp("task.create", { title: "" });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.json.data).toMatchObject({
        code: "BAD_REQUEST",
        zodError: { fieldErrors: { title: ["Title is required"] } },
      });
      expect(body.error.json.message).toBe("Title is required");
    });

    it("returns 404 for an unknown task", async () => {
      const response = await callOverHttp("task.delete", { id: UNKNOWN_ID });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.json.data.code).toBe("NOT_FOUND");
    });
  });
});
