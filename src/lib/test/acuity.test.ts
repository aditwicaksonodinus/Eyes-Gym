/// <reference types="vitest/globals" />
import {
  createAcuityTest,
  toSnellenFraction,
  toSnellenSix,
  toDecimal,
  bandForLogMAR,
} from "./acuity";

describe("createAcuityTest — ETDRS Line-by-Line 5-Letter Protocol", () => {
  it("perfect run (all 5 correct per line down to -0.3)", () => {
    const t = createAcuityTest({ startLogMAR: 1.0 });
    // 14 lines from 1.0 down to -0.3 (1.0, 0.9, ..., -0.3)
    while (!t.getState().done) {
      t.answer(true);
    }
    const r = t.result();
    expect(r.band).toBe("Normal");
    expect(r.snellenFraction).toBe("20/10");
    expect(r.snellenSix).toBe("6/3");
    expect(r.logMAR).toBe(-0.3);
  });

  it("early-exits on 3 incorrect/unreadable answers on a line (cannot pass)", () => {
    const t = createAcuityTest({ startLogMAR: 1.0 });
    t.answer(false);
    t.answer(false);
    t.answer(false);
    // 3 incorrect answers out of 5 -> max possible correct = 2 < 3 -> done = true immediately!
    expect(t.getState().done).toBe(true);
    expect(t.getState().answers.length).toBe(3);
  });

  it("all incorrect on first line (logMAR 1.0)", () => {
    const t = createAcuityTest({ startLogMAR: 1.0 });
    for (let i = 0; i < 5; i++) {
      t.answer(false);
    }
    const state = t.getState();
    expect(state.done).toBe(true);
    const r = t.result();
    expect(r.band).toBe("Perlu pemeriksaan");
    expect(r.snellenFraction).toBe("20/200");
    expect(r.snellenSix).toBe("6/60");
    expect(r.logMAR).toBe(1.0);
  });

  it("passes line 1.0 (5/5) and gets 2 correct on line 0.9 (letter credit bonus)", () => {
    const t = createAcuityTest({ startLogMAR: 1.0 });
    // Line 1.0: 5 correct -> passes line 1.0
    for (let i = 0; i < 5; i++) t.answer(true);
    expect(t.getState().logMAR).toBe(0.9);

    // Line 0.9: 2 correct, 3 incorrect -> fails line 0.9
    t.answer(true);
    t.answer(true);
    t.answer(false);
    t.answer(false);
    t.answer(false);

    expect(t.getState().done).toBe(true);
    const r = t.result();
    // Base = 1.0 passed line, credit = 2 * 0.02 = 0.04 -> estLogMAR = 0.96
    expect(r.logMAR).toBeCloseTo(0.96, 2);
    expect(r.band).toBe("Perlu pemeriksaan");
  });
});

describe("createAcuityTest — state & stop rules", () => {
  it("getState exposes logMAR, letterInLine, lineCorrectCount, done, answers", () => {
    const t = createAcuityTest({ startLogMAR: 1.0 });
    t.answer(true);
    const s = t.getState();
    expect(s.logMAR).toBe(1.0);
    expect(s.letterInLine).toBe(2);
    expect(s.lineCorrectCount).toBe(1);
    expect(s.done).toBe(false);
    expect(s.answers).toEqual([true]);
  });

  it("ignores answers once test is done", () => {
    const t = createAcuityTest({ startLogMAR: 1.0 });
    for (let i = 0; i < 5; i++) t.answer(false); // fails line 1.0
    expect(t.getState().done).toBe(true);
    const lenBefore = t.getState().answers.length;
    t.answer(true);
    expect(t.getState().answers.length).toBe(lenBefore);
  });
});

describe("acuity conversion helpers — defensive boundaries", () => {
  it("toSnellenFraction guards non-finite input", () => {
    expect(toSnellenFraction(NaN)).toBe("20/20");
    expect(toSnellenFraction(Infinity)).toBe("20/20");
    expect(toSnellenFraction(-Infinity)).toBe("20/20");
  });

  it("toSnellenSix guards non-finite input", () => {
    expect(toSnellenSix(NaN)).toBe("6/6");
    expect(toSnellenSix(Infinity)).toBe("6/6");
  });

  it("toDecimal guards non-finite input", () => {
    expect(Number.isFinite(toDecimal(NaN))).toBe(true);
    expect(toDecimal(NaN)).toBe(1);
  });

  it("bandForLogMAR guards non-finite input", () => {
    expect(bandForLogMAR(NaN)).toBe("Normal");
    expect(bandForLogMAR(Infinity)).toBe("Normal");
  });
});
