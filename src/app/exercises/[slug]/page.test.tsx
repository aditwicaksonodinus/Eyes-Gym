import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// The page uses next/navigation (useRouter, notFound) and next/link, which
// require the App Router context at runtime. In a unit test we stub them.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => undefined,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import ExerciseDetailPage from "./page";

beforeAll(() => {
  if (typeof window.matchMedia !== "function") {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as any;
  }
});

describe("ExerciseDetailPage", () => {
  it("renders heading, steps, and the Selesai button for a valid slug", () => {
    render(<ExerciseDetailPage params={{ slug: "blinking" }} />);

    // Heading (exercise name) is present.
    expect(
      screen.getByRole("heading", { level: 1, name: /Kedip Cepat/i }),
    ).toBeInTheDocument();

    // Step-by-step instructions render.
    expect(
      screen.getByText(/Kedip cepat dan penuh/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Istirahat sejenak 5 detik/i)).toBeInTheDocument();

    // The force-done "Selesai" button exists.
    expect(
      screen.getByRole("button", { name: /Selesai/i }),
    ).toBeInTheDocument();
  });
});
