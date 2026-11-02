import { expect, test } from "@playwright/test";
import { createTask, taskList, uniqueTitle } from "./helpers";

test.describe("delete task", () => {
  test("deletes a task after confirmation", async ({ page, request }) => {
    const task = await createTask(request, { title: uniqueTitle("To delete") });
    await page.goto("/tasks");

    await page.getByRole("button", { name: `Delete "${task.title}"` }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(task.title);
    await dialog.getByRole("button", { name: "Delete" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("Task deleted")).toBeVisible();
    await expect(
      taskList(page).getByRole("heading", { name: task.title }),
    ).toHaveCount(0);
  });

  test("keeps the task when the dialog is cancelled", async ({
    page,
    request,
  }) => {
    const task = await createTask(request, { title: uniqueTitle("To keep") });
    await page.goto("/tasks");
    const trigger = page.getByRole("button", {
      name: `Delete "${task.title}"`,
    });

    await trigger.click();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(
      taskList(page).getByRole("heading", { name: task.title }),
    ).toBeVisible();
  });

  test("a double click deletes once and reports it once", async ({
    page,
    request,
  }) => {
    const task = await createTask(request, { title: uniqueTitle("Double") });
    // The batch link packs calls made in the same tick into one request, so
    // count the operations inside each request body, not the requests.
    let deleteOperations = 0;
    page.on("request", (sent) => {
      if (!sent.url().includes("task.delete")) return;
      const body: Record<string, unknown> = sent.postDataJSON();
      deleteOperations += Object.keys(body).length;
    });
    await page.goto("/tasks");

    await page.getByRole("button", { name: `Delete "${task.title}"` }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete" })
      .dblclick();

    await expect(page.getByText("Task deleted")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(deleteOperations).toBe(1);
    await expect(page.getByText("This task was already deleted")).toHaveCount(
      0,
    );
  });
});
