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
  const SIX_M_MM = 6000;

  it("a 20/20 (logMAR 0) letter at 6 m subtends 5 arcminutes", () => {
    const pxPerMm = 10;
    const expected = 2 * SIX_M_MM * Math.tan(TWO_POINT_FIVE_ARCMIN_RAD) * pxPerMm;
    expect(computeLetterPx(SIX_M_MM, pxPerMm, 0)).toBeCloseTo(expected, 2);
  });

  it("scales linearly with px-per-mm", () => {
    const half = computeLetterPx(SIX_M_MM, 5, 0);
    const full = computeLetterPx(SIX_M_MM, 10, 0);
    expect(full).toBeCloseTo(half * 2, 6);
  });

  it("doubling the distance roughly doubles the letter px (same logMAR)", () => {
    const near = computeLetterPx(SIX_M_MM, 10, 0);
    const far = computeLetterPx(SIX_M_MM * 2, 10, 0);
    expect(far).toBeCloseTo(near * 2, 1);
  });

  it("logMAR 0.3 yields roughly 2× the logMAR 0 letter (0.1 logMAR ≈ 1.2589×)", () => {
    const base = computeLetterPx(SIX_M_MM, 10, 0);
    const worse = computeLetterPx(SIX_M_MM, 10, 0.3);
    // 10^0.3 ≈ 1.995; assert within ±2%
    expect(worse).toBeCloseTo(base * 10 ** 0.3, 1);
    expect(worse).toBeGreaterThan(base);
  });

  it("grows as logMAR worsens (bigger = lower acuity)", () => {
    expect(computeLetterPx(3000, 10, 0.2)).toBeGreaterThan(
      computeLetterPx(3000, 10, 0.1),
    );
  });

  it("logMAR 0 is the geometric baseline regardless of distance", () => {
    const expected = 2 * 1000 * Math.tan(TWO_POINT_FIVE_ARCMIN_RAD) * 11.81;
    expect(computeLetterPx(1000, 11.81, 0)).toBeCloseTo(expected, 2);
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
