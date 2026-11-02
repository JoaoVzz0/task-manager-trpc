import { expect, test } from "@playwright/test";
import { taskList, uniqueTitle } from "./helpers";

test.describe("create task", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tasks");
    await page.getByRole("link", { name: "New task" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "New task" }),
    ).toBeVisible();
  });

  test("blocks an empty title without calling the API", async ({ page }) => {
    const createCalls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("task.create"))
        createCalls.push(request.url());
    });

    await page.getByRole("button", { name: "Create task" }).click();

    await expect(page.getByText("Title is required")).toBeVisible();
    await expect(page.getByLabel("Title")).toBeFocused();
    expect(createCalls).toEqual([]);
  });

  test("creates a task and lists it first, with user text shown as text", async ({
    page,
  }) => {
    const title = uniqueTitle("Created in e2e");
    const description = "First line\n<b>not bold</b>";

    await page.getByLabel("Title").fill(title);
    await page.getByLabel(/Description/).fill(description);
    await page.getByRole("button", { name: "Create task" }).click();

    await expect(page).toHaveURL("/tasks");
    await expect(page.getByText("Task created")).toBeVisible();
    const firstCard = taskList(page).getByRole("listitem").first();
    await expect(firstCard.getByRole("heading", { level: 2 })).toHaveText(
      title,
    );
    await expect(firstCard).toContainText("<b>not bold</b>");
  });

  test("shows a server-side validation error on its field", async ({
    page,
  }) => {
    // Simulates a rule only the server knows about.
    await page.route("**/api/trpc/task.create*", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        json: [
          {
            error: {
              json: {
                message: "A task with this title already exists",
                code: -32600,
                data: {
                  code: "BAD_REQUEST",
                  httpStatus: 400,
                  path: "task.create",
                  zodError: {
                    formErrors: [],
                    fieldErrors: {
                      title: ["A task with this title already exists"],
                    },
                  },
                },
              },
            },
          },
        ],
      }),
    );

    await page.getByLabel("Title").fill(uniqueTitle("Duplicate"));
    await page.getByRole("button", { name: "Create task" }).click();

    await expect(
      page.getByText("A task with this title already exists"),
    ).toBeVisible();
    await expect(page.getByText("Could not save the task")).toBeHidden();
  });

  test("keeps the values when the server cannot be reached", async ({
    page,
  }) => {
    await page.route("**/api/trpc/task.create*", (route) =>
      route.abort("connectionrefused"),
    );
    const title = uniqueTitle("Offline");

    await page.getByLabel("Title").fill(title);
    await page.getByRole("button", { name: "Create task" }).click();

    await expect(page.getByText("Could not save the task")).toBeVisible();
    await expect(page.getByText("Could not reach the server")).toBeVisible();
    await expect(page.getByLabel("Title")).toHaveValue(title);
  });
});
