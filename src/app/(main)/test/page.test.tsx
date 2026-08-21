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
    const startNowButton = screen.getByRole("button", { name: "Mulai Sekarang" });
    expect(startNowButton).toBeInTheDocument();

    await user.click(startNowButton);

    // Step 2: acuity test buttons and letter now visible.
    expect(
      await screen.findByRole("button", { name: "Terbaca" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tidak Terbaca" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Huruf uji/i }),
    ).toBeInTheDocument();
  });
});
