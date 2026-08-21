import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import ExercisesPage from "./page";

function countCards(): number {
  // Each ExerciseCard renders a "Mulai" link to /exercises/${slug}.
  return screen.getAllByRole("link", { name: "Mulai" }).length;
}

describe("ExercisesPage", () => {
  it("renders all 10 exercise cards by default", () => {
    render(<ExercisesPage />);
    expect(countCards()).toBe(10);
  });

  it("narrows results when a category filter is applied", async () => {
    const user = (await import("@testing-library/user-event")).default;
    render(<ExercisesPage />);

    expect(countCards()).toBe(10);

    await user.click(screen.getByRole("button", { name: "Fokus" }));

    const after = countCards();
    expect(after).toBeLessThan(10);
    // Fokus category has exactly 2 exercises (near-far-focus, pencil-push-up).
    expect(after).toBe(2);
  });

  it("narrows results when a duration filter is applied", async () => {
    const user = (await import("@testing-library/user-event")).default;
    render(<ExercisesPage />);

    await user.click(screen.getByRole("button", { name: "31–60 detik" }));

    const after = countCards();
    expect(after).toBeLessThan(10);
    // Only palming (30–60) overlaps the 31–60 window.
    expect(after).toBe(1);
  });

  it("combines category and duration filters with AND", async () => {
    const user = (await import("@testing-library/user-event")).default;
    render(<ExercisesPage />);

    await user.click(screen.getByRole("button", { name: "Gerakan" }));
    await user.click(screen.getByRole("button", { name: "≤15 detik" }));

    const after = countCards();
    expect(after).toBeLessThan(10);
    // Gerakan + ≤15s: figure-8(30) no, eye-rolling(5–8) yes, atas-bawah(3) yes,
    // zig-zag(30) no, diagonal(5–8) yes => 3.
    expect(after).toBe(3);
  });

  it("resets to all when 'Semua' is clicked", async () => {
    const user = (await import("@testing-library/user-event")).default;
    render(<ExercisesPage />);

    await user.click(screen.getByRole("button", { name: "Fokus" }));
    expect(countCards()).toBe(2);

    // Two "Semua" buttons exist (category + duration); reset the category one.
    await user.click(screen.getAllByRole("button", { name: "Semua" })[0]);
    expect(countCards()).toBe(10);
  });

  it("every card links to its detail page", () => {
    render(<ExercisesPage />);
    const links = screen.getAllByRole("link", { name: "Mulai" });
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^\/exercises\/[a-z0-9-]+$/);
    }
  });
});
