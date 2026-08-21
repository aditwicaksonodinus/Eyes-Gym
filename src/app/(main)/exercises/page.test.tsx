import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ExercisesPage from "./page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/exercises",
}));

describe("ExercisesPage", () => {
  it("renders the list of exercises", () => {
    render(<ExercisesPage />);
    expect(screen.getByText("Latihan Mata")).toBeDefined();
    // Kedip Cepat should be in the list
    expect(screen.getByText("Kedip Cepat")).toBeDefined();
  });
});
