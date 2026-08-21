/// <reference types="vitest/globals" />
import {
  computeLetterPx,
  cmToMm,
  creditCardPxToMm,
  physicalPpiToPxPerMm,
  screenPhysicalPpi,
} from "./calibration";

/** Per ISO/IEC 7810 a standard credit card is 85.60 mm wide. */
const CREDIT_CARD_MM = 85.6;

/** 2.5 arcminutes in radians (base half-angle of a 20/20 letter). */
const TWO_POINT_FIVE_ARCMIN_RAD = (2.5 * Math.PI) / 10800;

describe("creditCardPxToMm", () => {
  it("inverts px-per-mm back to physical mm (credit card round-trips to 85.60)", () => {
    const pxPerMm = 10;
    const measuredPx = CREDIT_CARD_MM * pxPerMm; // 856.0 CSS/device px
    expect(creditCardPxToMm(measuredPx, pxPerMm)).toBeCloseTo(CREDIT_CARD_MM, 1);
  });

  it("is exactly pxWidth / pxPerMm", () => {
    expect(creditCardPxToMm(850, 10)).toBeCloseTo(85, 6);
    expect(creditCardPxToMm(1011, 11.81)).toBeCloseTo(85.61, 0);
  });
});

describe("physicalPpiToPxPerMm", () => {
  it("300 ppi ≈ 11.81 px/mm (300 / 25.4)", () => {
    expect(physicalPpiToPxPerMm(300)).toBeCloseTo(11.81, 1);
  });
});

describe("computeLetterPx", () => {
  // Default page inputs: 40 cm (400 mm) and a 200 px credit-card reading
  // (200 / 85.6 ≈ 2.336 px/mm). The starting logMAR-0 letter must be readable.
  const PAGE_DISTANCE_MM = 400;
  const PAGE_PX_PER_MM = 200 / 85.6;

  it("a logMAR-0 letter at the default page setup is clearly readable (~60–120px)", () => {
    const px = computeLetterPx(PAGE_DISTANCE_MM, PAGE_PX_PER_MM, 0);
    expect(px).toBeGreaterThanOrEqual(50);
    expect(px).toBeLessThanOrEqual(130);
  });

  it("scales with 10^logMAR: worse acuity → larger letter", () => {
    const base = computeLetterPx(400, 2, 0);
    const worse = computeLetterPx(400, 2, 0.3);
    expect(worse).toBeGreaterThan(base);
    expect(worse).toBeCloseTo(base * 10 ** 0.3, 1);
  });

  it("better acuity (logMAR -0.3) is smaller than logMAR 0 but still visible", () => {
    const best = computeLetterPx(400, 2, -0.3);
    const base = computeLetterPx(400, 2, 0);
    expect(best).toBeLessThan(base);
    expect(best).toBeGreaterThanOrEqual(24);
  });

  it("scales linearly with px-per-mm (within caps)", () => {
    const half = computeLetterPx(400, 2, 0);
    const full = computeLetterPx(400, 4, 0);
    expect(full).toBeCloseTo(half * 2, 6);
  });

  it("calibration (distance) feeds the size: farther → larger letter", () => {
    const near = computeLetterPx(300, 2, 0);
    const far = computeLetterPx(600, 2, 0);
    expect(far).toBeGreaterThan(near);
  });

  it("never returns NaN, negative, zero, or non-finite for normal inputs", () => {
    for (const lm of [-0.3, 0, 0.1, 0.5, 1.0]) {
      const px = computeLetterPx(400, 2.336, lm);
      expect(Number.isFinite(px)).toBe(true);
      expect(px).toBeGreaterThan(0);
    }
  });

  it("respects the minimum floor so the glyph is always drawn", () => {
    const px = computeLetterPx(1, 0.1, -0.3);
    expect(px).toBe(24);
  });

  it("respects the maximum ceiling so the letter stays on-screen", () => {
    const px = computeLetterPx(100000, 100, 1.0);
    expect(px).toBe(140);
  });

  it("honours custom base/min/max options", () => {
    const px = computeLetterPx(400, 2.336, 0, {
      basePx: 200,
      minPx: 50,
      maxPx: 300,
    });
    expect(px).toBeGreaterThan(100);
    expect(px).toBeLessThanOrEqual(300);
  });
});

describe("cmToMm", () => {
  it("converts centimeters to millimeters", () => {
    expect(cmToMm(30)).toBe(300);
    expect(cmToMm(0)).toBe(0);
    expect(cmToMm(1.5)).toBe(15);
  });
});

describe("screenPhysicalPpi", () => {
  it("returns null because physical PPI cannot be derived from browser DPR", () => {
    expect(screenPhysicalPpi(1)).toBeNull();
    expect(screenPhysicalPpi(2)).toBeNull();
    expect(screenPhysicalPpi(3)).toBeNull();
  });
});
