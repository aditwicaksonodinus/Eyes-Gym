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
 * Options for {@link computeLetterPx}.
 */
export interface ComputeLetterPxOptions {
  /**
   * Readable on-screen size (px) of a logMAR-0 letter for the *reference*
   * setup (a typical 96-DPI screen at 40 cm). The physically-correct letter
   * height at that setup is only ~2 px, so we map it up to this readable base
   * and let calibration + logMAR modulate around it. Default 100.
   */
  basePx?: number;
  /** Floor so a letter is never invisible (px). Default 24. */
  minPx?: number;
  /** Ceiling so a letter never overflows the card (px). Default 140. */
  maxPx?: number;
}

/** Reference px-per-mm: a typical 96-DPI screen (96 / 25.4). */
const REF_PX_PER_MM = 96 / 25.4;
/** Reference test distance (mm): 40 cm. */
const REF_DISTANCE_MM = 400;

/**
 * Compute the letter/optotype height in device px for a given test distance
 * and logMAR acuity, using the 5-arcminute-per-letter convention of a 20/20
 * (logMAR 0) line.
 *
 * A 20/20 letter subtends 5 arcminutes at the test distance; the referenced
 * 2.5' is the half-angle. The *physically-correct* height at a normal viewing
 * distance is only ~1–2 px on screen — mathematically right but invisible. To
 * keep the optotype readable we map that physical value onto a readable base
 * size (`basePx`) computed for a reference setup, then let the user's own
 * calibration (distanceMm, pxPerMm) and the acuity level (logMAR) modulate it:
 *
 *   physicalPx = 2 · distanceMm · tan(2.5′) · pxPerMm
 *   scale      = basePx / (2 · REF_DISTANCE_MM · tan(2.5′) · REF_PX_PER_MM)
 *   letterPx   = clamp(physicalPx · scale · 10^logMAR, minPx, maxPx)
 *
 * Worse acuity (higher logMAR) → larger letter (10^logMAR > 1); better acuity
 * (lower logMAR) → smaller letter. A floor (`minPx`) guarantees the glyph is
 * always drawn, and a ceiling (`maxPx`) keeps it on-screen.
 */
export function computeLetterPx(
  distanceMm: number,
  pxPerMm: number,
  logMAR: number,
  opts: ComputeLetterPxOptions = {},
): number {
  const basePx = opts.basePx ?? 100;
  const minPx = opts.minPx ?? 24;
  const maxPx = opts.maxPx ?? 140;

  const halfAngleRad = HALF_ANGLE_ARCMIN * ARCMIN_RAD;
  const physicalPx = 2 * distanceMm * Math.tan(halfAngleRad) * pxPerMm;
  const refPhysicalPx =
    2 * REF_DISTANCE_MM * Math.tan(halfAngleRad) * REF_PX_PER_MM;
  const scale = basePx / refPhysicalPx;

  const acuityScale = 10 ** logMAR;
  const raw = physicalPx * scale * acuityScale;
  return Math.min(maxPx, Math.max(minPx, raw));
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

/**
 * Compute the exact physical height (in millimeters) of a Snellen optotype
 * for a given test distance (mm) and logMAR visual acuity.
 * Uses exact 5-arcminute visual angle trigonometry:
 *   physicalMm = 2 · distanceMm · tan(2.5′) · 10^logMAR
 */
export function computePhysicalLetterMm(
  distanceMm: number,
  logMAR: number,
): number {
  const halfAngleRad = HALF_ANGLE_ARCMIN * ARCMIN_RAD;
  return 2 * distanceMm * Math.tan(halfAngleRad) * 10 ** logMAR;
}

/**
 * Compute the exact device pixel height for a 1:1 true physical visual angle.
 *   letterPx = physicalLetterMm · pxPerMm
 */
export function computeLetterPxPhysical(
  distanceMm: number,
  pxPerMm: number,
  logMAR: number,
  opts: { minPx?: number; maxPx?: number } = {},
): number {
  const physicalMm = computePhysicalLetterMm(distanceMm, logMAR);
  const rawPx = physicalMm * pxPerMm;
  const minPx = opts.minPx ?? 4;
  const maxPx = opts.maxPx ?? 600;
  return Math.min(maxPx, Math.max(minPx, rawPx));
}

