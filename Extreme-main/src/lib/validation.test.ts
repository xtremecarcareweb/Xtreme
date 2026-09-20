import { describe, expect, it } from "vitest";
import {
  sanitizeVehicleDetails,
  validateAndSanitizePhone,
  validateDate,
} from "./validation";

describe("booking validation", () => {
  it("rejects impossible calendar dates", () => {
    expect(validateDate("2026-02-30").isValid).toBe(false);
  });

  it("accepts formatted Indian phone numbers", () => {
    expect(validateAndSanitizePhone("+91 (98841) 49111")).toEqual({
      isValid: true,
      sanitized: "+919884149111",
    });
  });

  it("removes markup and unsupported vehicle characters", () => {
    expect(sanitizeVehicleDetails("<script>alert(1)</script> BMW X5")).toBe(
      "alert(1) BMW X5"
    );
  });
});