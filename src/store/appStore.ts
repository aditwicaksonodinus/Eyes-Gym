import { create } from "zustand";

/**
 * appStore — global in-memory state for the Eyes-Gym app.
 *
 * EPHEMERAL BY DESIGN: no `zustand/middleware` persist, no localStorage.
 * State lives only in memory and resets on page reload. Acute eye-test results
 * and questionnaire scores are intentionally NOT persisted.
 */

export type EyeSide = "left" | "right";
export type Device = "phone" | "tablet" | "store";

/** Per-device acuity reading for a single eye. */
export interface AcuityReading {
  /** Snellen-style value, e.g. "6/6". */
  snellen: string;
  /** Test distance in meters, when applicable. */
  distance?: number;
}

export interface QuestionResult {
  questionId: string;
  answer: number;
}

export interface EyeTestResult {
  left: Partial<Record<Device, AcuityReading>>;
  right: Partial<Record<Device, AcuityReading>>;
}

export interface QuestionnaireResult {
  score: number;
  answers: QuestionResult[];
  completedAt: number;
}

export interface SessionState {
  currentExercise: string | null;
  playlist: string[];
  /** Index of the exercise currently active within the playlist. */
  currentIndex: number;
  /** Indices already completed in the playlist. */
  completedIndices: number[];
}

export interface ReminderPrefs {
  enabled: boolean;
  /** Interval in minutes. */
  interval: number;
}

export interface ReminderUpdate {
  enabled?: boolean;
  interval?: number;
}

interface AppState {
  session: SessionState;
  reminder: ReminderPrefs;
  testResults: {
    eye: EyeTestResult;
    questionnaire: QuestionnaireResult[];
  };

  // Session actions
  setCurrentExercise(slug: string | null): void;
  setPlaylist(slugs: string[]): void;
  setCurrentIndex(index: number): void;
  completeExercise(index: number): void;

  // Reminder actions
  setReminder(update: ReminderUpdate): void;

  // Test-result actions
  setEyeResult(side: EyeSide, device: Device, reading: AcuityReading): void;
  resetEyeResults(): void;
  addQuestionnaire(result: QuestionnaireResult): void;

  // Reset everything to pristine in-memory defaults.
  reset(): void;
}

export const initialAppState: Omit<
  AppState,
  | "setCurrentExercise"
  | "setPlaylist"
  | "setCurrentIndex"
  | "completeExercise"
  | "setReminder"
  | "setEyeResult"
  | "resetEyeResults"
  | "addQuestionnaire"
  | "reset"
> = {
  session: {
    currentExercise: null,
    playlist: [],
    currentIndex: 0,
    completedIndices: [],
  },
  reminder: {
    enabled: false,
    interval: 20, // default 20-20-20 rule (min)
  },
  testResults: {
    eye: { left: {}, right: {} },
    questionnaire: [],
  },
};

/** Curried `create<State>()(...)` signature (Zustand 5 compatible). */
export const useAppStore = create<AppState>()((set) => ({
  ...initialAppState,

  setCurrentExercise(slug) {
    set((s) => ({ session: { ...s.session, currentExercise: slug } }));
  },

  setPlaylist(slugs) {
    set((s) => ({
      session: {
        ...s.session,
        playlist: slugs,
        currentIndex: 0,
        completedIndices: [],
      },
    }));
  },

  setCurrentIndex(index) {
    set((s) => ({ session: { ...s.session, currentIndex: index } }));
  },

  completeExercise(index) {
    set((s) => {
      const completedIndices = s.session.completedIndices.includes(index)
        ? s.session.completedIndices
        : [...s.session.completedIndices, index];
      return { session: { ...s.session, completedIndices } };
    });
  },

  setReminder(update) {
    set((s) => ({ reminder: { ...s.reminder, ...update } }));
  },

  setEyeResult(side, device, reading) {
    set((s) => ({
      testResults: {
        ...s.testResults,
        eye: {
          ...s.testResults.eye,
          [side]: { ...s.testResults.eye[side], [device]: reading },
        },
      },
    }));
  },

  resetEyeResults() {
    set((s) => ({
      testResults: { ...s.testResults, eye: { left: {}, right: {} } },
    }));
  },

  addQuestionnaire(result) {
    set((s) => ({
      testResults: {
        ...s.testResults,
        questionnaire: [...s.testResults.questionnaire, result],
      },
    }));
  },

  reset() {
    set({ ...initialAppState });
  },
}));
