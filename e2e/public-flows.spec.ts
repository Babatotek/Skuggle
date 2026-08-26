import { expect, test } from "@playwright/test";

test("landing page shows Skuggle brand without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /welcome to/i })).toBeVisible();
  await expect(page.getByText("Skuggle").first()).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
});

test("role navigator can open the teacher workspace", async ({ page }) => {
  await page.goto("/");
  await page.locator("#btn-toggle-role-switcher").click();
  await page.locator("#switcher-role-teacher").click();
  await expect(page.getByText(/Mr\. Adewale|Teacher/i).first()).toBeVisible();
});
