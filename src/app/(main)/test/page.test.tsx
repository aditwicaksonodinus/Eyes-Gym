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

  it("advances from intro (step 0) through questionnaire (step 1) then calibration (step 2) to acuity test (step 3)", async () => {
    const user = userEvent.setup();
    render(<TestPage />);

    // Step 0: intro — test buttons not yet present.
    expect(
      screen.queryByRole("button", { name: "Terbaca" }),
    ).not.toBeInTheDocument();

    // Click the CTA on step 0 to go to questionnaire (step 1)
    await user.click(
      screen.getByRole("button", { name: /Mulai/i }),
    );

    // Step 1: questionnaire — kalibrasi button not yet present, Lanjut ke Kalibrasi is present.
    const lanjutButton = screen.getByRole("button", { name: /Lanjut ke Kalibrasi/i });
    expect(lanjutButton).toBeInTheDocument();

    await user.click(lanjutButton);

    // Step 2: calibration — "Mulai Tes 2 Meter" is now present.
    const startNowButton = screen.getByRole("button", { name: /Mulai Tes 2 Meter/i });
    expect(startNowButton).toBeInTheDocument();

    await user.click(startNowButton);

    // Step 3: acuity test 4-choice buttons, unreadable button, and letter image are visible.
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
