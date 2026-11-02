import { expect, test } from "@playwright/test";
import { createTask, deleteTask, taskList, uniqueTitle } from "./helpers";

test.describe("edit task", () => {
  test("edits a task from the list", async ({ page, request }) => {
    const task = await createTask(request, {
      title: uniqueTitle("To edit"),
      description: "Will be removed",
    });
    const newTitle = uniqueTitle("Edited");

    await page.goto("/tasks");
    await page.getByRole("link", { name: `Edit "${task.title}"` }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "Edit task" }),
    ).toBeVisible();
    await expect(page.getByLabel("Title")).toHaveValue(task.title);
    const save = page.getByRole("button", { name: "Save changes" });
    await expect(save).toBeDisabled();

    await page.getByLabel("Title").fill(newTitle);
    await page.getByLabel(/Description/).fill("");
    await save.click();

    await expect(page).toHaveURL("/tasks");
    await expect(page.getByText("Task updated")).toBeVisible();
    const card = taskList(page)
      .getByRole("listitem")
      .filter({ hasText: newTitle });
    await expect(card).toContainText("Edited");
    await expect(card).not.toContainText("Will be removed");
  });

  test("shows the not-found page for unknown and malformed ids", async ({
    page,
  }) => {
    for (const id of ["11111111-1111-4111-8111-111111111111", "abc"]) {
      await page.goto(`/tasks/${id}/edit`);
      await expect(page.getByText("Task not found")).toBeVisible();
      // Streaming has already sent a 200 by the time the page calls
      // notFound(), so Next marks the page as noindex instead.
      await expect(
        page.locator('meta[name="robots"][content="noindex"]').first(),
      ).toBeAttached();
    }
  });

  test("returns to the list when the task was deleted meanwhile", async ({
    page,
    request,
  }) => {
    const task = await createTask(request, { title: uniqueTitle("Vanishing") });
    await page.goto(`/tasks/${task.id}/edit`);
    await expect(page.getByLabel("Title")).toHaveValue(task.title);

    await deleteTask(request, task.id);
    await page.getByLabel("Title").fill(`${task.title} (edited)`);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("This task no longer exists")).toBeVisible();
    await expect(page).toHaveURL("/tasks");
  });
});
