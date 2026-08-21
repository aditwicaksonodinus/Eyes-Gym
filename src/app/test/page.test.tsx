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

  it("advances from disclaimer (step 0) to calibration (step 1) on 'Mulai Tes'", async () => {
    const user = userEvent.setup();
    render(<TestPage />);

    // Step 0: disclaimer only — calibration control not yet present.
    expect(
      screen.queryByLabelText(/lebar kartu kredit di layar/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mulai Tes" }));

    // Step 1: calibration inputs now visible.
    expect(
      screen.getByLabelText(/lebar kartu kredit di layar/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Lanjut" }),
    ).toBeInTheDocument();
  });

  it("enters the acuity step (step 2) and renders the test letter + answer buttons", async () => {
    const user = userEvent.setup();
    render(<TestPage />);

    await user.click(screen.getByRole("button", { name: "Mulai Tes" }));
    await user.click(screen.getByRole("button", { name: "Lanjut" }));

    // Step 2 must initialise the engine and show the optotype (regression: a
    // missing state setter used to throw here, leaving the step blank/stuck).
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
