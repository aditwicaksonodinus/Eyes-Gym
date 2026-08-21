import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// framer-motion's motion.div can touch matchMedia/reduced-motion internals in
// jsdom; polyfill it as the page test does.
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

import { EyeStage } from "./EyeStage";
import { EXERCISES, type Exercise } from "@/lib/exercises";

const exercise: Exercise = EXERCISES.find((e) => e.slug === "figure-8")!;

describe("EyeStage", () => {
  it("inline mode renders role=img with aria-label prefix and no exit button", () => {
    const { container } = render(
      <EyeStage exercise={exercise} reduceMotion={false} fullscreen={false} onExit={vi.fn()} />,
    );

    const img = screen.getByRole("img", {
      name: "Ilustrasi gerakan mata untuk Angka 8",
    });
    expect(img).toHaveClass(
      "relative mx-auto aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background",
    );
    expect(
      container.querySelector(".fixed.inset-0"),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Keluar dari layar penuh" }),
    ).not.toBeInTheDocument();
  });

  it("fullscreen mode renders a fixed inset-0 element and an exit button", () => {
    render(
      <EyeStage exercise={exercise} reduceMotion={false} fullscreen onExit={vi.fn()} />,
    );

    expect(
      document.querySelector(".fixed.inset-0"),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Keluar dari layar penuh" }),
    ).toBeInTheDocument();
  });

  it("clicking the fullscreen exit button calls onExit", () => {
    const onExit = vi.fn();
    render(
      <EyeStage exercise={exercise} reduceMotion={false} fullscreen onExit={onExit} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Keluar dari layar penuh" }),
    );
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("reduceMotion renders a static (non-motion) centred icon in inline mode", () => {
    const { container } = render(
      <EyeStage exercise={exercise} reduceMotion fullscreen={false} onExit={vi.fn()} />,
    );

    const centering = container.querySelector<HTMLElement>(
      "div.absolute.inset-0",
    );
    expect(centering).not.toBeNull();
    expect(
      centering!.querySelector(".flex.h-16.w-16.items-center.justify-center"),
    ).not.toBeNull();
    // The inner moving stage is a plain div: buildEyeMotion returns null for
    // reduce=true, so no framer-motion `style` (motion.div sets a
    // will-change/transform style) is attached — the icon stays centred.
    const stage = centering!.querySelector("div.absolute.inset-0");
    expect(stage).not.toBeNull();
    expect(stage!.hasAttribute("style")).toBe(false);
  });

  it("reduceMotion renders a stationary icon in fullscreen mode", () => {
    const { container } = render(
      <EyeStage exercise={exercise} reduceMotion fullscreen onExit={vi.fn()} />,
    );

    expect(container.querySelector(".fixed.inset-0")).not.toBeNull();
    const field = container.querySelector<HTMLElement>("div.relative.h-full.w-full");
    expect(field).not.toBeNull();
    const stage = field!.querySelector("div.absolute.inset-0") as HTMLElement | null;
    expect(stage).not.toBeNull();
    expect(
      stage!.querySelector(".flex.h-16.w-16.items-center.justify-center"),
    ).not.toBeNull();
    expect(stage!.hasAttribute("style")).toBe(false);
  });
});
