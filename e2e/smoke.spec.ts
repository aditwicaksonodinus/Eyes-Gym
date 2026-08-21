import { expect, test } from "@playwright/test";

test("landing page renders Indonesian title/markup", async ({ page }) => {
  await page.goto("/");

  // html lang is "id"
  await expect(page.locator("html")).toHaveAttribute("lang", "id");

  // Navbar brand logo text
  await expect(
    page.getByRole("link", { name: "SeeFit" })
  ).toBeVisible();

  // Indonesian metadata <title>
  await expect(page).toHaveTitle(/SeeFit/);
});
