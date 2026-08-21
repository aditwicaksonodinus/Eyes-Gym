import { beforeEach, describe, expect, it } from "vitest";
import {
  initialAppState,
  useAppStore,
  type EyeTestResult,
  type QuestionnaireResult,
} from "./appStore";

describe("appStore (zustand, ephemeral in-memory state)", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it("is ephemeral: exposes no persist/localStorage adapter", () => {
    const store = useAppStore.getState() as unknown as {
      persist?: unknown;
      localStorage?: unknown;
    };
    expect(store.persist).toBeUndefined();
    const p = useAppStore as unknown as { persist?: unknown };
    expect(p.persist).toBeUndefined();
    // Defaults match the pristine in-memory snapshot.
    expect(useAppStore.getState().session).toEqual(initialAppState.session);
    expect(useAppStore.getState().reminder).toEqual(initialAppState.reminder);
  });

  describe("session state", () => {
    it("sets the current exercise via get/set", () => {
      useAppStore.getState().setCurrentExercise("palming");
      expect(useAppStore.getState().session.currentExercise).toBe("palming");
    });

    it("setPlaylist resets progress and sets a fresh playlist", () => {
      useAppStore.getState().setPlaylist(["palming", "blinking"]);
      let s = useAppStore.getState().session;
      expect(s.playlist).toEqual(["palming", "blinking"]);
      expect(s.currentIndex).toBe(0);
      expect(s.completedIndices).toEqual([]);

      // complete + advance, then replacing playlist resets progress again
      useAppStore.getState().completeExercise(0);
      useAppStore.getState().setCurrentIndex(1);
      useAppStore.getState().setPlaylist(["figure-eight"]);
      s = useAppStore.getState().session;
      expect(s.playlist).toEqual(["figure-eight"]);
      expect(s.currentIndex).toBe(0);
      expect(s.completedIndices).toEqual([]);
    });

    it("tracks completion without duplicating indices", () => {
      useAppStore.getState().setPlaylist(["a", "b", "c"]);
      useAppStore.getState().completeExercise(1);
      useAppStore.getState().completeExercise(1); // idempotent
      expect(useAppStore.getState().session.completedIndices).toEqual([1]);
      useAppStore.getState().completeExercise(2);
      expect(useAppStore.getState().session.completedIndices).toEqual([1, 2]);
    });

    it("setCurrentExercise to null clears the active exercise", () => {
      useAppStore.getState().setCurrentExercise("rolling");
      useAppStore.getState().setCurrentExercise(null);
      expect(useAppStore.getState().session.currentExercise).toBeNull();
    });
  });

  describe("reminder prefs", () => {
    it("toggles enabled and interval via partial update", () => {
      expect(useAppStore.getState().reminder).toEqual({
        enabled: false,
        interval: 20,
      });
      useAppStore.getState().setReminder({ enabled: true });
      expect(useAppStore.getState().reminder.enabled).toBe(true);
      // interval untouched by enabled-only update
      expect(useAppStore.getState().reminder.interval).toBe(20);

      useAppStore.getState().setReminder({ interval: 5 });
      expect(useAppStore.getState().reminder).toEqual({
        enabled: true,
        interval: 5,
      });
    });
  });

  describe("test results", () => {
    it("stores per-eye per-device acuity readings", () => {
      useAppStore.getState().setEyeResult("left", "phone", {
        snellen: "6/6",
        distance: 0.4,
      });
      useAppStore.getState().setEyeResult("left", "store", { snellen: "6/9" });
      useAppStore.getState().setEyeResult("right", "tablet", { snellen: "6/12" });

      const eye = useAppStore.getState().testResults.eye;
      expect(eye.left.phone).toEqual({ snellen: "6/6", distance: 0.4 });
      expect(eye.left.store).toEqual({ snellen: "6/9" });
      expect(eye.right.tablet).toEqual({ snellen: "6/12" });
      // untouched devices remain undefined
      expect(eye.right.phone).toBeUndefined();
      expect(eye.right.store).toBeUndefined();
    });

    it("resetEyeResults clears only eye results", () => {
      useAppStore.getState().setEyeResult("left", "phone", { snellen: "6/6" });
      const q: QuestionnaireResult = {
        score: 3,
        answers: [{ questionId: "q1", answer: 2 }],
        completedAt: 1,
      };
      useAppStore.getState().addQuestionnaire(q);
      expect(useAppStore.getState().testResults.questionnaire).toHaveLength(1);

      useAppStore.getState().resetEyeResults();
      expect(useAppStore.getState().testResults.eye).toEqual<EyeTestResult>({
        left: {},
        right: {},
      });
      // questionnaire preserved
      expect(useAppStore.getState().testResults.questionnaire).toHaveLength(1);
    });

    it("appends questionnaire scores", () => {
      useAppStore.getState().addQuestionnaire({
        score: 2,
        answers: [],
        completedAt: 10,
      });
      useAppStore.getState().addQuestionnaire({
        score: 4,
        answers: [],
        completedAt: 20,
      });
      const scores = useAppStore
        .getState()
        .testResults.questionnaire.map((r) => r.score);
      expect(scores).toEqual([2, 4]);
    });
  });

  it("reset() returns the whole store to pristine defaults", () => {
    useAppStore.getState().setCurrentExercise("rolling");
    useAppStore.getState().setReminder({ enabled: true, interval: 2 });
    useAppStore.getState().setEyeResult("left", "phone", { snellen: "6/6" });
    useAppStore.getState().addQuestionnaire({ score: 5, answers: [], completedAt: 9 });

    useAppStore.getState().reset();

    const s = useAppStore.getState();
    expect(s.session).toEqual(initialAppState.session);
    expect(s.reminder).toEqual(initialAppState.reminder);
    expect(s.testResults.eye).toEqual<EyeTestResult>({ left: {}, right: {} });
    expect(s.testResults.questionnaire).toEqual([]);
  });
});
