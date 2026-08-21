/**
 * TDD tests for triage & refractive indication classification logic.
 */
import { describe, it, expect } from "vitest";
import { triage, triageAcuity, classifyRefraction } from "@/lib/test/triage";
import { QUESTIONS, scoreBand } from "@/lib/test/questions";

const DISCLAIMER = "Ini pemeriksaan mandiri, bukan diagnosis medis.";

describe("questions", () => {
  it("exports 8 questions (6 symptoms + 2 refractive screening questions)", () => {
    expect(QUESTIONS).toHaveLength(8);
  });

  it("every question has a non-empty id and text", () => {
    for (const q of QUESTIONS) {
      expect(typeof q.id).toBe("string");
      expect(q.id.length).toBeGreaterThan(0);
      expect(typeof q.text).toBe("string");
      expect(q.text.length).toBeGreaterThan(0);
    }
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(8);
  });

  it("scoreBand maps score ranges", () => {
    expect(scoreBand(0)).toBe("rendah");
    expect(scoreBand(3)).toBe("rendah");
    expect(scoreBand(4)).toBe("sedang");
    expect(scoreBand(6)).toBe("sedang");
    expect(scoreBand(7)).toBe("tinggi");
  });
});

describe("classifyRefraction", () => {
  it("classifies Myopia (Mata Minus) when distance visual acuity is reduced (>0.1 logMAR)", () => {
    const res = classifyRefraction({ leftLogMAR: 0.3, rightLogMAR: 0.3 });
    expect(res.type).toBe("myopia");
    expect(res.label).toContain("Miopia");
    expect(res.explanation).toContain("jarak jauh 2 meter");
  });

  it("classifies Presbyopia (Mata Plus / Tua) when distance visual acuity is normal (6/6) but near reading is difficult", () => {
    const res = classifyRefraction({
      leftLogMAR: 0.0,
      rightLogMAR: 0.0,
      nearDifficultyScore: 2,
      ageScore: 2,
    });
    expect(res.type).toBe("presbyopia");
    expect(res.label).toContain("Presbiopia");
    expect(res.explanation).toContain("jarak dekat");
  });

  it("classifies Astigmatism / Asymmetry when inter-eye difference is ≥ 0.2 logMAR", () => {
    const res = classifyRefraction({ leftLogMAR: 0.0, rightLogMAR: 0.3 });
    expect(res.type).toBe("astigmatism");
    expect(res.label).toContain("Astigmatisme");
  });

  it("classifies Emmetropia (Normal) when distance acuity is 6/6 and no near reading issues", () => {
    const res = classifyRefraction({
      leftLogMAR: 0.0,
      rightLogMAR: 0.0,
      nearDifficultyScore: 0,
      ageScore: 0,
    });
    expect(res.type).toBe("emmetropia");
    expect(res.label).toContain("Normal");
  });
});

describe("triageAcuity", () => {
  it("returns per-eye bands plus best/worst/asymmetry", () => {
    const r = triageAcuity({ leftLogMAR: 0.0, rightLogMAR: 0.3 });
    expect(r.left.band).toBe("Normal");
    expect(r.right.band).toBe("Ringan");
    expect(r.best).toBe(0.0);
    expect(r.worst).toBe(0.3);
    expect(r.asymmetry).toBeCloseTo(0.3);
  });
});

describe("triage logic with refractive indication", () => {
  it("includes refractiveIndication in TriageResult", () => {
    const acuity = triageAcuity({ leftLogMAR: 0.0, rightLogMAR: 0.0 });
    const res = triage({ acuity, symptomScore: 1 });
    expect(res.refractiveIndication).toBeDefined();
    expect(res.refractiveIndication.type).toBe("emmetropia");
  });

  it("referral branch includes refractiveIndication and doctor message", () => {
    const acuity = triageAcuity({ leftLogMAR: 0.0, rightLogMAR: 0.6 });
    const res = triage({ acuity, symptomScore: 0 });
    expect(res.branch).toBe("referral");
    // asymmetry = 0.6 >= 0.2, so astigmatism is detected first (takes priority)
    expect(res.refractiveIndication.type).toBe("astigmatism");
    expect(res.disclaimer).toBe(DISCLAIMER);
  });
});
