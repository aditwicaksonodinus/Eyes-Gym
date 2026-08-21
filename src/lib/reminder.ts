/**
 * Pure, framework-free helpers for the 20-20-20 reminder feature.
 *
 * Everything here is side-effect free and safe to unit test without a DOM,
 * a real `Notification` object, or a `navigator`. UI code (reminder-gate)
 * consumes these helpers and owns the side effects (worker, SW, vibration).
 */

export type PermissionState = "default" | "granted" | "denied" | "unsupported";

/** Inputs that decide whether the permission primer should be shown. */
export interface PrimerInput {
  /** Number of completed value moments (tests/exercises). */
  valueMoments: number;
  /** Whether the reminder is already enabled. */
  enabled: boolean;
  /** Current notification permission state. */
  permission: PermissionState;
}

/**
 * Show the primer only after the user has completed at least one value moment
 * (so we don't nag on first paint), the reminder isn't already enabled, and
 * permission hasn't been permanently denied.
 */
export function shouldShowPrimer(state: PrimerInput): boolean {
  return state.valueMoments > 0 && !state.enabled && state.permission !== "denied";
}

/** Body text for the 20-20-20 reminder notification (Indonesian). */
export function notificationBody(): string {
  return "Waktunya istirahat mata — terapkan 20-20-20";
}

/**
 * Whether the device supports the Vibration API. Guarded so it is safe to call
 * in environments where `navigator` is undefined (SSR, tests).
 */
export function canVibrate(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}
