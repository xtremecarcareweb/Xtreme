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

  it("accepts and normalizes valid Indian phone numbers", () => {
    expect(validateAndSanitizePhone("9876543210")).toEqual({
      isValid: true,
      sanitized: "9876543210",
    });
    expect(validateAndSanitizePhone("9123456789")).toEqual({
      isValid: true,
      sanitized: "9123456789",
    });
    expect(validateAndSanitizePhone("+919876543210")).toEqual({
      isValid: true,
      sanitized: "9876543210",
    });
    expect(validateAndSanitizePhone("+91 9876543210")).toEqual({
      isValid: true,
      sanitized: "9876543210",
    });
    expect(validateAndSanitizePhone("919876543210")).toEqual({
      isValid: true,
      sanitized: "9876543210",
    });
    expect(validateAndSanitizePhone("09876543210")).toEqual({
      isValid: true,
      sanitized: "9876543210",
    });
    expect(validateAndSanitizePhone("+91 (98841) 49111")).toEqual({
      isValid: true,
      sanitized: "9884149111",
    });
  });

  it("rejects invalid phone numbers", () => {
    expect(validateAndSanitizePhone("1234567890").isValid).toBe(false);
    expect(validateAndSanitizePhone("98765").isValid).toBe(false);
    expect(validateAndSanitizePhone("abcdefghij").isValid).toBe(false);
    expect(validateAndSanitizePhone("0000000000").isValid).toBe(false);
  });

  it("removes markup and unsupported vehicle characters", () => {
    expect(sanitizeVehicleDetails("<script>alert(1)</script> BMW X5")).toBe(
      "alert(1) BMW X5"
    );
  });
});