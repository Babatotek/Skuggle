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

test("school registration requires email verification before welcome", async ({ page }) => {
  await page.route("**/sanctum/csrf-cookie", async (route) => {
    await route.fulfill({ status: 204 });
  });
  await page.route("**/api/v1/schools/register", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { requiresVerification: true } }),
    });
  });

  await page.goto("/");
  await page.getByText("Register & Sign In", { exact: true }).click();
  await page.getByText("Enter school portal", { exact: true }).click();
  await page.getByRole("button", { name: "Create a school account" }).click();

  await page.getByLabel("School name").fill("Flow Academy");
  await page.getByLabel("Administrator name").fill("Flow Owner");
  await page.getByLabel("Administrator email").fill("owner@flow.example");
  await page.getByLabel("Create password").fill("Pass123!");
  await page.getByLabel("Confirm password").fill("Pass123!");
  await page.getByRole("button", { name: /Create school account/ }).click();

  await expect(page.getByRole("dialog", { name: "Verify your email to continue" })).toBeVisible();
  await expect(page.getByText("owner@flow.example")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Flow Academy" })).toHaveCount(0);
});
