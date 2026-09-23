import { z } from "zod";

const HTML_TAGS = /<[^>]*>/g;
const NAME_PATTERN = /^[\p{L}][\p{L}\s.'-]*$/u;
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{6,19}$/;
const TIME_SLOT_PATTERN = /^(09:00|10:30|12:00|14:00|16:00|18:00)$/;

export function sanitizeText(value: string, maxLength: number): string {
  const withoutControlCharacters = Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 0x1f && code !== 0x7f;
    })
    .join("");

  return withoutControlCharacters.replace(HTML_TAGS, "").trim().slice(0, maxLength);
}

export function sanitizeVehicleDetails(value: string): string {
  return sanitizeText(value, 100);
}

export function validateDate(value: string): { isValid: boolean; error?: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { isValid: false, error: "Invalid date format" };
  }

  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return { isValid: false, error: "Invalid calendar date" };
  }

  return { isValid: true };
}

export function validateAndSanitizePhone(value: string): { isValid: boolean; sanitized?: string; error?: string } {
  if (!value || typeof value !== "string") {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove any non-digits
  const digits = value.replace(/\D/g, "");

  // Handle standard 10-digit Indian numbers
  let sanitized = "";
  if (digits.length === 10) {
    sanitized = digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    sanitized = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    sanitized = digits.slice(2);
  } else {
    return { isValid: false, error: "Please enter a valid 10-digit phone number" };
  }

  // Indian mobile numbers start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(sanitized)) {
    return { isValid: false, error: "Phone number must start with 6, 7, 8, or 9" };
  }

  return { isValid: true, sanitized };
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const dateCheck = validateDate(value);
  if (!dateCheck.isValid) return false;

  const selected = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(selected.getTime()) && selected >= today;
}

const bookingSchema = z.object({
  name: z.string().min(2).max(100).regex(NAME_PATTERN, "Enter a valid name"),
  phone: z.string().regex(PHONE_PATTERN, "Enter a valid phone number"),
  email: z.string().email().max(254),
  vehicleType: z.string().min(1).max(60),
  carModel: z.string().max(100),
  date: z.string().refine(isValidDate, "Select a valid future date"),
  timeSlot: z.string().regex(TIME_SLOT_PATTERN, "Select a valid time slot"),
  service: z.string().min(1).max(500),
  notes: z.string().max(1000),
  price: z.number().finite().nonnegative(),
});

export interface ValidatedBookingInput {
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  carModel: string;
  date: string;
  timeSlot: string;
  service: string;
  notes: string;
  price: number;
}

export interface ValidatedCancellationInput {
  phone: string;
  date: string;
  timeSlot: string;
}

export type ValidationResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };

export function validateBookingInput(input: {
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  carModel: string;
  date: string;
  timeSlot: string;
  service: string;
  notes: string;
  price: number;
}): ValidationResult<ValidatedBookingInput> {
  const result = bookingSchema.safeParse({
    ...input,
    name: sanitizeText(input.name, 100),
    phone: sanitizeText(input.phone, 20),
    email: sanitizeText(input.email, 254).toLowerCase(),
    vehicleType: sanitizeText(input.vehicleType, 60),
    carModel: sanitizeText(input.carModel, 100),
    date: sanitizeText(input.date, 10),
    timeSlot: sanitizeText(input.timeSlot, 5),
    service: sanitizeText(input.service, 500),
    notes: sanitizeText(input.notes, 1000),
  });

  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "Please check your booking details" };
  }

  return { success: true, data: result.data as ValidatedBookingInput };
}

const cancellationSchema = z.object({
  phone: z.string().regex(PHONE_PATTERN, "Enter a valid phone number"),
  date: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Select a valid date"),
  timeSlot: z.string().regex(TIME_SLOT_PATTERN, "Select a valid time slot"),
});

export function validateCancellationInput(input: {
  phone: string;
  date: string;
  timeSlot: string;
}): ValidationResult<ValidatedCancellationInput> {
  const result = cancellationSchema.safeParse({
    phone: sanitizeText(input.phone, 20),
    date: sanitizeText(input.date, 10),
    timeSlot: sanitizeText(input.timeSlot, 5),
  });

  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "Please check the cancellation details" };
  }

  return { success: true, data: result.data as ValidatedCancellationInput };
}