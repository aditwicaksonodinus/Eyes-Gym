import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SessionPage from "./page";

describe("exercises/session page", () => {
  it("starts the playlist and shows the first exercise name", async () => {
    const user = userEvent.setup();
    render(<SessionPage />);

    // Idle state: the start button is present.
    const startButton = screen.getByRole("button", { name: /mulai sesi/i });
    expect(startButton).toBeInTheDocument();

    // First exercise name should NOT be visible before starting.
    expect(
      screen.queryByText("Kedip Cepat"),
    ).not.toBeInTheDocument();

    await user.click(startButton);

    // After starting, the first exercise (blinking) name appears.
    expect(screen.getByText("Kedip Cepat")).toBeInTheDocument();
  });
});
