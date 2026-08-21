import { describe, expect, it } from "vitest";
import {
  canVibrate,
  notificationBody,
  shouldShowPrimer,
  type PermissionState,
} from "./reminder";

describe("reminder pure helpers", () => {
  describe("shouldShowPrimer", () => {
    const base = { valueMoments: 1, enabled: false, permission: "default" as PermissionState };

    it("is false before any value moment", () => {
      expect(shouldShowPrimer({ ...base, valueMoments: 0 })).toBe(false);
    });

    it("is true after first value moment, not enabled, permission default", () => {
      expect(shouldShowPrimer(base)).toBe(true);
    });

    it("is true with permission granted but reminder not yet enabled", () => {
      expect(shouldShowPrimer({ ...base, permission: "granted" })).toBe(true);
    });

    it("is false when the reminder is already enabled", () => {
      expect(shouldShowPrimer({ ...base, enabled: true })).toBe(false);
    });

    it("is false when permission is denied", () => {
      expect(shouldShowPrimer({ ...base, permission: "denied" })).toBe(false);
    });

    it("is true when unsupported (no Notification API) — not denied", () => {
      expect(shouldShowPrimer({ ...base, permission: "unsupported" })).toBe(true);
    });
  });

  describe("notificationBody", () => {
    it("returns the Indonesian 20-20-20 reminder copy", () => {
      expect(notificationBody()).toBe(
        "Waktunya istirahat mata — terapkan 20-20-20"
      );
    });
  });

  describe("canVibrate", () => {
    const originalNavigator = globalThis.navigator;

    const setNavigator = (value: unknown) => {
      Object.defineProperty(globalThis, "navigator", {
        value,
        configurable: true,
        writable: true,
      });
    };

    afterEach(() => {
      setNavigator(originalNavigator);
    });

    it("returns false when navigator is undefined", () => {
      setNavigator(undefined);
      expect(canVibrate()).toBe(false);
    });

    it("returns false when navigator exists but lacks vibrate", () => {
      setNavigator({} as Navigator);
      expect(canVibrate()).toBe(false);
    });

    it("returns true when navigator supports vibrate", () => {
      setNavigator({ vibrate: () => true } as unknown as Navigator);
      expect(canVibrate()).toBe(true);
    });
  });
});
