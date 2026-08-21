/// <reference types="vitest/globals" />
import { createAcuityTest } from "./acuity";

/**
 * Hand-computed reference for the scripted mixed sequence below.
 *
 * Convention (documented in acuity.ts): a reversal is recorded at the logMAR
 * value AFTER the step that flipped the response direction. The final estimate
 * averages the reversal points AFTER the first reversal; with <=1 reversal the
 * final clamped logMAR is reported instead.
 *
 * Sequence C,C,I,C,I,I,C,I (start 0.0, step 0.1, clamp [-0.3, 1.0]):
 *   1 C -> -0.1
 *   2 C -> -0.2
 *   3 I -> -0.1  (rev 1 @ -0.1)
 *   4 C -> -0.2  (rev 2 @ -0.2)
 *   5 I -> -0.1  (rev 3 @ -0.1)
 *   6 I ->  0.0
 *   7 C -> -0.1  (rev 4 @ -0.1)
 *   8 I ->  0.0  (rev 5 @  0.0)
 * reversalLogMARs = [-0.1, -0.2, -0.1, -0.1, 0.0]
 * after first = [-0.2, -0.1, -0.1, 0.0] -> avg = -0.1
 * 10^-0.1 = 0.79433 -> 20*0.79433 = 15.89 -> "20/16"; 6*0.79433 = 4.77 -> "6/5"
 * decimal = 10^0.1 = 1.25893
 */
describe("createAcuityTest — perfect (all correct)", () => {
  it("reports band Normal and best Snellen (20/10) when every answer is correct", () => {
    const t = createAcuityTest();
    for (let i = 0; i < 8; i++) t.answer(true);
    const r = t.result();
    expect(r.band).toBe("Normal");
    expect(r.snellenFraction).toBe("20/10");
    expect(r.logMAR).toBeLessThanOrEqual(0.1);
  });
});

describe("createAcuityTest — all incorrect", () => {
  it("reports band 'Perlu pemeriksaan' and Snellen worse than 20/60", () => {
    const t = createAcuityTest();
    for (let i = 0; i < 11; i++) t.answer(false);
    const r = t.result();
    expect(r.band).toBe("Perlu pemeriksaan");
    const denom = Number(r.snellenFraction.split("/")[1]);
    expect(denom).toBeGreaterThan(60);
    expect(r.snellenFraction).toBe("20/200");
  });
});

describe("createAcuityTest — scripted mixed sequence", () => {
  it("matches hand-computed Snellen/decimal/band for C,C,I,C,I,I,C,I", () => {
    const t = createAcuityTest();
    const seq = [true, true, false, true, false, false, true, false];
    for (const c of seq) t.answer(c);
    const r = t.result();
    expect(r.logMAR).toBeCloseTo(-0.1, 6);
    expect(r.snellenFraction).toBe("20/16");
    expect(r.snellenSix).toBe("6/5");
    expect(r.decimal).toBeCloseTo(1.2589, 4);
    expect(r.band).toBe("Normal");
    expect(t.getState().reversals).toBe(5);
  });
});

describe("createAcuityTest — band boundaries", () => {
  it("logMAR 0.1 -> Normal", () => {
    const t = createAcuityTest();
    t.answer(false); // 0.0 -> 0.1, no reversal -> final clamped 0.1
    expect(t.result().band).toBe("Normal");
  });

  it("logMAR 0.2 -> Ringan", () => {
    const t = createAcuityTest();
    t.answer(false);
    t.answer(false); // 0.2
    expect(t.result().band).toBe("Ringan");
  });

  it("logMAR 0.5 -> Perlu pemeriksaan", () => {
    const t = createAcuityTest();
    for (let i = 0; i < 5; i++) t.answer(false); // 0.5
    expect(t.result().band).toBe("Perlu pemeriksaan");
  });
});

describe("createAcuityTest — state + stop rule", () => {
  it("getState exposes logMAR, done, reversals, answers", () => {
    const t = createAcuityTest();
    t.answer(true);
    const s = t.getState();
    expect(s).toHaveProperty("logMAR");
    expect(s).toHaveProperty("done");
    expect(s).toHaveProperty("reversals");
    expect(Array.isArray(s.answers)).toBe(true);
    expect(s.answers).toEqual([true]);
  });

  it("stops when logMAR hits a bound and cannot move further", () => {
    const t = createAcuityTest();
    for (let i = 0; i < 11; i++) t.answer(false); // clamps at 1.0 then stops
    expect(t.getState().done).toBe(true);
    expect(t.getState().logMAR).toBe(1.0);
  });

  it("ignores answers after done", () => {
    const t = createAcuityTest();
    for (let i = 0; i < 11; i++) t.answer(false);
    const before = t.getState().answers.length;
    t.answer(true);
    expect(t.getState().answers.length).toBe(before);
  });
});
