import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TestPage from "./page";

describe("TestPage (/test wizard)", () => {
  it("shows the disclaimer with the required Indonesian phrases", () => {
    render(<TestPage />);
    expect(screen.getByText(/pemeriksaan mandiri/i)).toBeInTheDocument();
    expect(
      screen.getByText(/bukan diagnosis medis/i),
    ).toBeInTheDocument();
  });

  it("advances from disclaimer (step 0) through instructions (step 1) to acuity test (step 2)", async () => {
    const user = userEvent.setup();
    render(<TestPage />);

    // Step 0: disclaimer only — test buttons not yet present.
    expect(
      screen.queryByRole("button", { name: "Terbaca" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mulai Tes" }));

    // Step 1: instructions page is shown. Start button is now present.
    const startNowButton = screen.getByRole("button", { name: /Mulai Tes 2 Meter/i });
    expect(startNowButton).toBeInTheDocument();

    await user.click(startNowButton);

    // Step 2: acuity test 4-choice buttons, unreadable button, and letter image are visible.
    expect(
      await screen.findByRole("img", { name: /Huruf uji/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Huruf Tidak Terlihat/i }),
    ).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    // 4 letter option buttons + 1 unreadable button + nav buttons
    expect(buttons.length).toBeGreaterThanOrEqual(5);
  });
});
