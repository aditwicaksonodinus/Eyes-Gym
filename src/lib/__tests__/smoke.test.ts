import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("smoke", () => {
  it("asserts basic math", () => {
    expect(1 + 1).toBe(2);
  });

  it("cn merges className inputs via @/ alias", () => {
    expect(cn("a", undefined, "b c")).toBe("a b c");
    // twMerge resolves tailwind conflicts: later wins
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
