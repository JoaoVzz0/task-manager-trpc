import { expect, test } from "@playwright/test";
import { taskList } from "./helpers";

test.describe("task list", () => {
  test("renders the first page on the server, with no API request", async ({
    page,
  }) => {
    const apiCalls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/trpc")) apiCalls.push(request.url());
    });

    await page.goto("/");

    await expect(page).toHaveURL("/tasks");
    await expect(
      page.getByRole("heading", { level: 1, name: "Tasks" }),
    ).toBeVisible();
    await expect(taskList(page).getByRole("listitem")).toHaveCount(10);
    await page.waitForLoadState("networkidle");
    expect(apiCalls).toEqual([]);
  });

  test("loads more tasks while scrolling, until the end", async ({ page }) => {
    await page.goto("/tasks");
    // Scroll triggers attach on hydration, and unlike clicks, scrolling done
    // before it is not replayed by React.
    await page.waitForLoadState("networkidle");
    const endOfList = page.getByText("You've reached the end");

    await expect(async () => {
      await page.mouse.wheel(0, 5000);
      await expect(endOfList).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20_000 });

    const titles = await taskList(page)
      .getByRole("heading", { level: 2 })
      .allInnerTexts();
    expect(titles.length).toBeGreaterThan(10);
    expect(new Set(titles).size).toBe(titles.length);
  });

  test("shows an inline error when a later page fails, then recovers", async ({
    page,
  }) => {
    await page.goto("/tasks");
    await page.waitForLoadState("networkidle");
    await page.route("**/api/trpc/task.list*", (route) =>
      route.abort("connectionrefused"),
    );

    await page
      .getByRole("button", { name: "Load more" })
      .scrollIntoViewIfNeeded();

    const alert = page
      .getByRole("alert")
      .filter({ hasText: "Could not load more tasks" });
    // Network failures are retried twice before the error is shown.
    await expect(alert).toBeVisible({ timeout: 15_000 });
    await expect(alert).toContainText("Could not reach the server");
    await expect(taskList(page).getByRole("listitem")).toHaveCount(10);

    await page.unroute("**/api/trpc/task.list*");
    await alert.getByRole("button", { name: "Try again" }).click();

    await expect(taskList(page).getByRole("listitem")).toHaveCount(20);
    await expect(alert).toBeHidden();
  });
});
