import { describe, expect, it } from "vitest";
import {
  getBookableDateRange,
  getBookingDateError,
  sanitizeVehicleDetails,
  validateAndSanitizePhone,
  validateCustomerDetails,
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

  it("only allows booking dates from today up to 90 days ahead", () => {
    const now = new Date(2026, 8, 30, 15, 0); // 30 Sep 2026, local time
    expect(getBookableDateRange(now)).toEqual({ min: "2026-09-30", max: "2026-12-29" });
    expect(getBookingDateError("2026-09-30", now)).toBeNull();
    expect(getBookingDateError("2026-12-29", now)).toBeNull();
    expect(getBookingDateError("2026-09-01", now)).toMatch(/past/);
    expect(getBookingDateError("2026-12-30", now)).toMatch(/90 days/);
    expect(getBookingDateError("9999-12-31", now)).toMatch(/90 days/);
    expect(getBookingDateError("2026-02-30", now)).toMatch(/valid date/);
  });

  it("reports each invalid customer detail field", () => {
    const valid = { name: "Test User", phone: "9876543210", email: "a@b.co", carModel: "", notes: "" };
    expect(validateCustomerDetails(valid)).toEqual({});
    expect(validateCustomerDetails({ ...valid, email: "notanemail" })).toEqual({ email: "Enter a valid email address" });
    expect(validateCustomerDetails({ ...valid, phone: "123" })).toEqual({ phone: "Enter a valid phone number" });
    expect(Object.keys(validateCustomerDetails({ ...valid, name: "'; DROP TABLE bookings; --", phone: "1" }))).toEqual([
      "name",
      "phone",
    ]);
  });
});
