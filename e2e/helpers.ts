import type { APIRequestContext, Page } from "@playwright/test";

type CreatedTask = { id: string; title: string };

/** Unique per call, so tests never collide in the shared in-memory store. */
export function uniqueTitle(prefix: string): string {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `${prefix} ${suffix}`;
}

/** Sets up data through the API, so a test only exercises the UI it is about. */
export async function createTask(
  request: APIRequestContext,
  input: { title: string; description?: string },
): Promise<CreatedTask> {
  const response = await request.post("/api/trpc/task.create", {
    data: { json: input },
  });
  if (!response.ok()) {
    throw new Error(`task.create failed with HTTP ${response.status()}`);
  }
  const body: { result: { data: { json: CreatedTask } } } =
    await response.json();
  return body.result.data.json;
}

export async function deleteTask(
  request: APIRequestContext,
  id: string,
): Promise<void> {
  const response = await request.post("/api/trpc/task.delete", {
    data: { json: { id } },
  });
  if (!response.ok()) {
    throw new Error(`task.delete failed with HTTP ${response.status()}`);
  }
}

/** The task list section; its cards are the list items inside it. */
export function taskList(page: Page) {
  return page.getByRole("region", { name: "Tasks" });
}
