/**
 * TDD tests for the triage + symptom questionnaire logic.
 *
 * Covers every triage branch (normal / borderline / referral) and the two
 * hard-referral triggers (worst eye > 0.5, and inter-eye asymmetry ≥ 0.2).
 * Critical invariant: a referral NEVER routes to an exercise CTA.
 */
import { describe, it, expect } from "vitest";
import { triage, triageAcuity } from "@/lib/test/triage";
import { QUESTIONS, scoreBand } from "@/lib/test/questions";

const DISCLAIMER = "Ini pemeriksaan mandiri, bukan diagnosis medis.";

describe("questions", () => {
  it("exports exactly 6 questions", () => {
    expect(QUESTIONS).toHaveLength(6);
  });

  it("every question has a non-empty id and text", () => {
    expect(QUESTIONS).toHaveLength(6);
    for (const q of QUESTIONS) {
      expect(typeof q.id).toBe("string");
      expect(q.id.length).toBeGreaterThan(0);
      expect(typeof q.text).toBe("string");
      expect(q.text.length).toBeGreaterThan(0);
    }
    // ids are unique
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(6);
  });

  it("scoreBand maps the three ranges", () => {
    expect(scoreBand(0)).toBe("rendah");
    expect(scoreBand(2)).toBe("rendah");
    expect(scoreBand(3)).toBe("sedang");
    expect(scoreBand(4)).toBe("sedang");
    expect(scoreBand(5)).toBe("tinggi");
    expect(scoreBand(12)).toBe("tinggi");
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

  it("handles equal eyes", () => {
    const r = triageAcuity({ leftLogMAR: 0.2, rightLogMAR: 0.2 });
    expect(r.best).toBe(0.2);
    expect(r.worst).toBe(0.2);
    expect(r.asymmetry).toBe(0);
  });
});

describe("triage — normal branch", () => {
  it("normal when both eyes ≤0.1 and symptomScore ≤2", () => {
    const acuity = triageAcuity({ leftLogMAR: 0.0, rightLogMAR: 0.1 });
    const res = triage({ acuity, symptomScore: 2 });
    expect(res.branch).toBe("normal");
    expect(res.cta).toBe("prevention");
    expect(res.message.toLowerCase()).toContain("20-20-20");
    expect(res.disclaimer).toBe(DISCLAIMER);
  });
});

describe("triage — borderline branch", () => {
  it("borderline via worst eye in 0.2–0.4 (asymmetry < 0.2)", () => {
    const acuity = triageAcuity({ leftLogMAR: 0.2, rightLogMAR: 0.3 });
    const res = triage({ acuity, symptomScore: 0 });
    expect(res.branch).toBe("borderline");
    expect(res.cta).toBe("exercise");
    expect(res.ctaLabel).toBe("Mulai Latihan");
  });

  it("borderline via symptomScore 3–4 with healthy acuity", () => {
    const acuity = triageAcuity({ leftLogMAR: 0.0, rightLogMAR: 0.0 });
    const res = triage({ acuity, symptomScore: 3 });
    expect(res.branch).toBe("borderline");
    expect(res.cta).toBe("exercise");
  });

  it("borderline via high (≥5) symptomScore with healthy acuity", () => {
    const acuity = triageAcuity({ leftLogMAR: 0.0, rightLogMAR: 0.0 });
    const res = triage({ acuity, symptomScore: 5 });
    expect(res.branch).toBe("borderline");
    expect(res.cta).toBe("exercise");
  });
});

describe("triage — hard-referral branch", () => {
  it("referral when worst eye > 0.5", () => {
    const acuity = triageAcuity({ leftLogMAR: 0.0, rightLogMAR: 0.6 });
    const res = triage({ acuity, symptomScore: 0 });
    expect(res.branch).toBe("referral");
    expect(res.cta).toBeNull();
  });

  it("referral when inter-eye asymmetry ≥ 0.2", () => {
    const acuity = triageAcuity({ leftLogMAR: 0.0, rightLogMAR: 0.2 });
    const res = triage({ acuity, symptomScore: 0 });
    expect(res.branch).toBe("referral");
    expect(res.cta).toBeNull();
  });

  it("referral NEVER routes to exercise, even with high symptoms", () => {
    const acuity = triageAcuity({ leftLogMAR: 0.0, rightLogMAR: 0.6 });
    const res = triage({ acuity, symptomScore: 6 });
    expect(res.branch).toBe("referral");
    expect(res.cta).toBeNull();
    expect(res.cta).not.toBe("exercise");
  });

  it("referral message points to a doctor and carries the disclaimer", () => {
    const acuity = triageAcuity({ leftLogMAR: 0.0, rightLogMAR: 0.6 });
    const res = triage({ acuity, symptomScore: 0 });
    expect(res.message).toContain("dokter mata");
    expect(res.disclaimer).toBe(DISCLAIMER);
  });
});
