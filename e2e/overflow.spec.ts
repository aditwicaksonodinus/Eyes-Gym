import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Failing–first proof of the horizontal-overflow bug on lg (≥1024px) viewports.
 *
 * The bug: the eye-animation illustration box on the exercise detail page
 * (`src/app/exercises/[slug]/exercise-detail-client.tsx`) and the identical
 * box on the `/test` acuity step (`src/app/test/page.tsx`) carry the Tailwind
 * classes `lg:w-screen lg:max-w-none lg:mx-0`. On `lg`, `w-screen` = 100vw makes
 * the box wider than its centered, padded `<Card>`, so it escapes the card to
 * the left and right (at 1280px: box spans the full 100vw while the Card spans
 * only 16→1264).
 *
 * These tests assert the FIXED behaviour (box contained within its Card, no
 * page-level horizontal scroll). On the current, unfixed code every card-
 * containment assertion FAILS; once the two `lg:w-screen lg:max-w-none
 * lg:mx-0` occurrences are removed (box becomes `w-full`, i.e. 100% of its
 * CardContent) they PASS.
 *
 * Note on document scroll vs. card containment: `src/app/layout.tsx` wraps the
 * page in `<main class="... overflow-x-hidden">`, so an out-of-bounds box is
 * clipped and `document.documentElement.scrollWidth` stays ≤ `clientWidth`.
 * The scroll-width assertion is kept as the page-level invariant (and passes
 * trivially on the current code), while the card-containment assertion is the
 * one that genuinely proves the bug on the unfixed code.
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
 * Asserts the illustration box stays within its `<Card>` horizontally. The
 * stable Card selector is `div.rounded-lg.border` (shadcn Card's base classes
 * in `src/components/ui/card.tsx`). On the unfixed code the `w-screen` box is
 * far wider than the Card, so it escapes both edges and this fails.
 */
async function assertBoxWithinCard(page: Page, box: Locator): Promise<void> {
  await expect(box).toBeVisible();
  const res = await box.evaluate((el) => {
    const card = el.closest("div.rounded-lg.border");
    if (!card) return { ok: false, reason: "no-card" };
    const b = el.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    // Small epsilon for sub-pixel rounding from 100vw layout.
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
}

// ── Exercise detail pages ────────────────────────────────────────────────────

test("detail page eye-animation box has no horizontal overflow (zig-zag)", async ({
  page,
}) => {
  await page.goto("/exercises/zig-zag");

  // The illustration box: role="img" with aria-label `Ilustrasi gerakan mata
  // untuk ${name}` (stable, independent of shadcn/Card internals).
  const box = page.locator(
    '[role="img"][aria-label^="Ilustrasi gerakan mata"]',
  );

  await assertNoDocumentHorizontalOverflow(page);
  await assertBoxWithinCard(page, box);
});

test("figure-8 detail page has no horizontal overflow", async ({ page }) => {
  await page.goto("/exercises/figure-8");

  const box = page.locator(
    '[role="img"][aria-label^="Ilustrasi gerakan mata"]',
  );

  await assertNoDocumentHorizontalOverflow(page);
  await assertBoxWithinCard(page, box);
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
  await assertBoxWithinCard(page, box);
});
