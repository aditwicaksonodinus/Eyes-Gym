import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

describe("ExerciseDetailPage (fullscreen layout)", () => {
  it("renders exercise name in heading and the Selesai button", () => {
    render(<ExerciseDetailPage params={{ slug: "blinking" }} />);

    // h1 heading with exercise name in the TopHeader overlay.
    expect(
      screen.getByRole("heading", { level: 1, name: /Kedip Cepat/i }),
    ).toBeInTheDocument();

    // The force-done "Selesai" button exists in the bottom panel.
    expect(
      screen.getByRole("button", { name: /Selesai/i }),
    ).toBeInTheDocument();
  });

  it("shows step-by-step instructions when 'Cara?' button is clicked", async () => {
    const user = userEvent.setup();
    render(<ExerciseDetailPage params={{ slug: "blinking" }} />);

    // Instructions are hidden initially (inside InstructionsDrawer).
    expect(screen.queryByText(/Kedip cepat dan penuh/i)).not.toBeInTheDocument();

    // Open the drawer.
    await user.click(screen.getByRole("button", { name: /Cara melakukan latihan ini/i }));

    // Instructions are now visible.
    expect(screen.getByText(/Kedip cepat dan penuh/i)).toBeInTheDocument();
    expect(screen.getByText(/Istirahat sejenak 5 detik/i)).toBeInTheDocument();
  });

  it("renders 'Kembali' navigation link pointing to /exercises", () => {
    render(<ExerciseDetailPage params={{ slug: "blinking" }} />);
    const backLink = screen.getByRole("link", { name: /Kembali ke daftar latihan/i });
    expect(backLink).toHaveAttribute("href", "/exercises");
  });
});
