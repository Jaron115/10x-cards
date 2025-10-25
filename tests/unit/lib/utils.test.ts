/**
 * Example unit test for utility functions
 * This demonstrates how to test pure functions using Vitest
 */

import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("Utils", () => {
  describe("cn (classname utility)", () => {
    it("should merge class names", () => {
      const result = cn("base", "additional");
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("should handle conditional classes", () => {
      const isHidden = false;
      const isVisible = true;
      const result = cn("base", isHidden && "hidden", isVisible && "visible");
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("should handle undefined and null values", () => {
      const result = cn("base", undefined, null);
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });
  });
});
