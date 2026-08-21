import { expect, test, type Page } from "@playwright/test";

/**
 * Fullscreen layout guards for the exercise detail page.
 *
 * With the new design, `/exercises/[slug]` is ALWAYS fullscreen from the start:
 * - The animation stage (`div.fixed.inset-0`) fills the viewport immediately.
 * - A glassmorphism bottom panel provides timer/rep controls and a "Cara?" button.
 * - A `TopHeader` overlay provides navigation (← Kembali).
 * - There is no longer an inline preview card or an explicit "enter fullscreen"
 *   button. The old `activeFullscreen` toggle concept is gone.
 *
 * These tests validate:
 * 1. The fixed animation stage covers the full viewport on page load.
 * 2. The bottom control panel is visible with the correct exercise controls.
 * 3. The "Cara?" button opens the InstructionsDrawer (bottom sheet).
 * 4. The "← Kembali" link in TopHeader navigates to /exercises.
 * 5. No horizontal document overflow on the detail page.
 * 6. The /test acuity illustration (unchanged) has no overflow.
 */
test.use({ viewport: { width: 1280, height: 900 } });

/** Page-level invariant: no horizontal document scrollbar. */
async function assertNoDocumentHorizontalOverflow(page: Page): Promise<void> {
  const ok = await page.evaluate(() => {
    return (
      document.documentElement.scrollWidth <= document.documentElement.clientWidth
    );
  });
  await expect(ok).toBeTruthy();
}

/**
 * Asserts the animation stage wrapper covers the viewport — left/top ≤ 1 and
 * right/bottom ≥ innerWidth/innerHeight (1px tolerance for sub-pixel rounding).
 */
async function assertStageCoversViewport(page: Page): Promise<void> {
  // The fixed animation stage is the `fixed inset-0 z-0` wrapper div.
  const stage = page.locator("div.fixed.inset-0").first();
  await expect(stage).toBeVisible();

  const rect = await stage.evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
  });
  const { vw, vh } = await page.evaluate(() => ({
    vw: window.innerWidth,
    vh: window.innerHeight,
  }));

  await expect(
    rect.left,
    `stage left ${rect.left} should be ≤ 1`,
  ).toBeLessThanOrEqual(1);
  await expect(
    rect.top,
    `stage top ${rect.top} should be ≤ 1`,
  ).toBeLessThanOrEqual(1);
  await expect(
    rect.right,
    `stage right ${rect.right} should be ≥ innerWidth ${vw}`,
  ).toBeGreaterThanOrEqual(vw - 1);
  await expect(
    rect.bottom,
    `stage bottom ${rect.bottom} should be ≥ innerHeight ${vh}`,
  ).toBeGreaterThanOrEqual(vh - 1);
}

// ── Exercise detail: fullscreen layout always active ─────────────────────────

test("exercise detail page (zig-zag) loads fullscreen stage immediately", async ({ page }) => {
  await page.goto("/exercises/zig-zag");

  // Animation stage covers the viewport on load (no trigger required).
  await assertStageCoversViewport(page);

  // No horizontal document overflow.
  await assertNoDocumentHorizontalOverflow(page);

  // Bottom panel shows the Mulai button (duration-based exercise, timer not started).
  await expect(
    page.getByRole("button", { name: /Mulai/ }),
  ).toBeVisible();

  // "Selesai" force-done button is in the bottom panel.
  await expect(
    page.getByTestId("selesai-button"),
  ).toBeVisible();
});

test("exercise detail page (figure-8) loads fullscreen stage immediately", async ({ page }) => {
  await page.goto("/exercises/figure-8");

  // Animation stage covers the viewport on load.
  await assertStageCoversViewport(page);

  // No horizontal document overflow.
  await assertNoDocumentHorizontalOverflow(page);

  // Rep-based: shows "Selesai 1 repetisi".
  await expect(
    page.getByRole("button", { name: /Selesai 1 repetisi/ }),
  ).toBeVisible();
});

test("exercise detail page: 'Cara?' opens InstructionsDrawer with steps", async ({ page }) => {
  await page.goto("/exercises/blinking");

  // The InstructionsDrawer is hidden by default.
  await expect(page.getByText(/Kedip cepat dan penuh/i)).not.toBeVisible();

  // Click the "Cara?" button to open the drawer.
  await page.getByRole("button", { name: /Cara melakukan latihan ini/i }).click();

  // Instructions are now visible in the drawer.
  await expect(page.getByText(/Kedip cepat dan penuh/i)).toBeVisible();

  // Close the drawer.
  await page.getByRole("button", { name: /Tutup panduan/i }).click();
  await expect(page.getByText(/Kedip cepat dan penuh/i)).not.toBeVisible();
});

test("exercise detail page: TopHeader has correct exercise name and back link", async ({ page }) => {
  await page.goto("/exercises/near-far-focus");

  // Exercise name is visible in the header.
  await expect(
    page.getByRole("heading", { name: /Fokus Dekat–Jauh/i }),
  ).toBeVisible();

  // Back link points to /exercises.
  const backLink = page.getByRole("link", { name: /Kembali ke daftar latihan/i });
  await expect(backLink).toBeVisible();
  await expect(backLink).toHaveAttribute("href", "/exercises");
});

test("exercise detail panel collapse/expand toggles the control section", async ({ page }) => {
  await page.goto("/exercises/blinking");

  // The Selesai button is visible in the expanded panel.
  await expect(page.getByTestId("selesai-button")).toBeVisible();

  // Collapse the panel.
  await page.getByRole("button", { name: /Ciutkan/i }).click();

  // The Selesai button is now hidden.
  await expect(page.getByTestId("selesai-button")).not.toBeVisible();

  // Expand the panel again.
  await page.getByRole("button", { name: /Tampilkan kontrol/i }).click();

  // The Selesai button is visible again.
  await expect(page.getByTestId("selesai-button")).toBeVisible();
});

// ── /test acuity illustration (step 2) ───────────────────────────────────────

test("/test acuity illustration (step 2) has no horizontal overflow", async ({
  page,
}) => {
  await page.goto("/test");

  // Wizard: step 0 → 1 → 2.
  await page.getByRole("button", { name: "Mulai Tes" }).click();
  await page.getByRole("button", { name: "Lanjut" }).click();

  // step 2 only renders after the `useEffect` on `step===2` calls
  // `startEye("left")`, which sets engineReady and renders the acuity card.
  // CardTitle renders a <div>, so wait on its text (not a heading role).
  await expect(page.getByText("Tes Ketajaman").first()).toBeVisible();

  const box = page
    .locator("div.relative.aspect-video.w-full.overflow-hidden")
    .first();

  await assertNoDocumentHorizontalOverflow(page);
  // Inline acuity box should still be within the Card.
  const res = await box.evaluate((el) => {
    const card = el.closest("div.rounded-lg.border");
    if (!card) return { ok: false, reason: "no-card" };
    const b = el.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    return {
      ok: b.left >= c.left - 0.5 && b.right <= c.right + 0.5,
      boxLeft: Math.round(b.left),
      boxRight: Math.round(b.right),
      cardLeft: Math.round(c.left),
      cardRight: Math.round(c.right),
    };
  });
  await expect(
    res.ok,
    `box (${res.boxLeft}→${res.boxRight}) escapes its Card (${res.cardLeft}→${res.cardRight})`,
  ).toBeTruthy();
});
