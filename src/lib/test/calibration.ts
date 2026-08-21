/**
 * Screen calibration — pure math helpers for converting a user's measured
 * screen sizes into physical dimensions and optotype letter heights.
 *
 * This module is PURE: no React, no `window`/`navigator` at module scope.
 * Browser DPR reading (if any) belongs in the caller/page layer and is passed
 * in as plain numbers. Every function is deterministic so the whole module is
 * directly unit-testable without a DOM.
 *
 * Calibration flow: the user holds a standard credit card (ISO/IEC 7810:
 * 85.60 mm wide) against their screen and we read its CSS/device pixel width;
 * dividing by the known physical width yields a calibrated px-per-mm.
 */

/** Width of a standard credit card in millimeters (ISO/IEC 7810, ID-1). */
export const CREDIT_CARD_WIDTH_MM = 85.6;

/** Base visual angle of a 20/20 (logMAR 0) Sloan letter in arcminutes. */
const TWENTY_TWENTY_LETTER_ARCMIN = 5;

/** Half-angle of a 20/20 letter, used in `letterPx = 2·d·tan(2.5')`. */
const HALF_ANGLE_ARCMIN = TWENTY_TWENTY_LETTER_ARCMIN / 2;

/** One arcminute in radians = (π/180)/60 = π/10800. */
const ARCMIN_RAD = Math.PI / 10800;

/** Convert a distance or size in centimeters to millimeters. */
export function cmToMm(cm: number): number {
  return cm * 10;
}

/**
 * Physical screen density: device (CSS) pixels per physical millimeter.
 * Derived from a physical PPI value (e.g. a monitor spec sheet).
 */
export function physicalPpiToPxPerMm(ppi: number): number {
  return ppi / 25.4;
}

/**
 * Convert a measured credit-card width in CSS/device px to physical mm using a
 * calibrated px-per-mm. Inverse of `sizeMm * pxPerMm`; correct only when the
 * supplied `devicePxPerMm` accurately reflects the user's screen.
 */
export function creditCardPxToMm(pxWidth: number, devicePxPerMm: number): number {
  return pxWidth / devicePxPerMm;
}

/**
 * Compute the letter/optotype height in device px for a given test distance
 * and logMAR acuity, using the 5-arcminute-per-letter convention of a 20/20
 * (logMAR 0) line.
 *
 * A 20/20 letter subtends 5 arcminutes at the test distance; the referenced
 * 2.5' is the half-angle. Standard Snellen small-angle formula:
 *   letterPx = 2 · distanceMm · tan(2.5′) · pxPerMm
 * Larger logMAR (worse acuity) scales the letter by `10^logMAR`
 * (the 0.1-logMAR-per-doubling-convention).
 */
export function computeLetterPx(
  distanceMm: number,
  pxPerMm: number,
  logMAR: number,
): number {
  const halfAngleRad = HALF_ANGLE_ARCMIN * ARCMIN_RAD;
  const baseLetterMm = 2 * distanceMm * Math.tan(halfAngleRad);
  const acuityScale = 10 ** logMAR;
  return baseLetterMm * pxPerMm * acuityScale;
}

/**
 * Single-helper alias for {@link computeLetterPx}. Returns the letter height in
 * device px from a calibrated px-per-mm, test distance, and logMAR acuity.
 */
export function letterPxFrom(
  distanceMm: number,
  pxPerMm: number,
  logMAR: number,
): number {
  return computeLetterPx(distanceMm, pxPerMm, logMAR);
}

/**
 * Device-pixel-ratio guard. CSS `dpr` does NOT encode physical pixels-per-inch
 * (it is a presentation ratio), so physical PPI cannot be derived in a browser
 * from DPR alone. Always returns `null`, signalling the caller must fall back
 * to credit-card calibration. Kept pure: no `window`/`navigator` access.
 */
export function screenPhysicalPpi(_dpr: number): number | null {
  return null;
}
