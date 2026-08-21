import { expect, test } from "@playwright/test";

test("landing page renders Indonesian title/markup", async ({ page }) => {
  await page.goto("/");

  // html lang is "id"
  await expect(page.locator("html")).toHaveAttribute("lang", "id");

  // Indonesian heading from the placeholder landing
  await expect(
    page.getByRole("heading", { name: "Senam Mata" })
  ).toBeVisible();

  // Indonesian metadata <title>
  await expect(page).toHaveTitle(/Senam Mata/);
});
