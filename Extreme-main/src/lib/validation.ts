/**
 * Input Validation & Sanitization Utilities
 * Prevents XSS, SQL injection, and malformed data
 */

/**
 * Sanitize string input by removing HTML tags and dangerous characters
 */
export function sanitizeString(input: string): string {
  if (!input) return "";
  return input
    .trim()
    // Remove HTML/script tags
    .replace(/<[^>]*>/g, "")
    // Remove common XSS patterns
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    // Limit length to prevent DoS
    .slice(0, 500);
}

/**
 * Sanitize name field (alphanumeric, spaces, hyphens, apostrophes only)
 */
export function sanitizeName(input: string): string {
  if (!input) return "";
  const sanitized = sanitizeString(input);
  // Allow letters, spaces, hyphens, apostrophes, and common Indian characters
  return sanitized.replace(/[^a-zA-Z\s\-'अ-ह०-९]/g, "").slice(0, 100);
}

/**
 * Sanitize a vehicle make/model without allowing markup or control characters.
 */
export function sanitizeVehicleDetails(input: string): string {
  if (!input) return "";
  return sanitizeString(input)
    .replace(/[^a-zA-Z0-9\s\-'./()&+अ-ह०-९]/g, "")
    .slice(0, 100);
}

/**
 * Validate and sanitize email address
 */
export function validateAndSanitizeEmail(email: string): {
  isValid: boolean;
  sanitized: string;
} {
  const sanitized = sanitizeString(email).toLowerCase().trim();

  // RFC 5322 simplified email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return {
    isValid: emailRegex.test(sanitized) && sanitized.length <= 254,
    sanitized,
  };
}

/**
 * Validate and sanitize phone number (Indian format)
 */
export function validateAndSanitizePhone(phone: string): {
  isValid: boolean;
  sanitized: string;
} {
  const sanitized = phone.trim().replace(/[\s().-]/g, "");

  // Allow +91 format or 10-digit numbers
  const phoneRegex = /^(\+91|0)?[6-9]\d{9}$/;

  return {
    isValid: phoneRegex.test(sanitized),
    sanitized,
  };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(date: string): {
  isValid: boolean;
  sanitized: string;
} {
  const sanitized = sanitizeString(date);
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(sanitized)) {
    return { isValid: false, sanitized };
  }

  try {
    const [year, month, day] = sanitized.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isCalendarDate =
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day;

    // Date must be today or in future
    return {
      isValid: isCalendarDate && dateObj >= now,
      sanitized,
    };
  } catch {
    return { isValid: false, sanitized };
  }
}

/**
 * Validate time slot format (HH:MM)
 */
export function validateTimeSlot(time: string): {
  isValid: boolean;
  sanitized: string;
} {
  const sanitized = sanitizeString(time);
  const timeRegex = /^\d{2}:\d{2}$/;

  if (!timeRegex.test(sanitized)) {
    return { isValid: false, sanitized };
  }

  const [hours, minutes] = sanitized.split(":").map(Number);
  const isValid =
    hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;

  return { isValid, sanitized };
}

/**
 * Sanitize notes/comments field
 */
export function sanitizeNotes(input: string): string {
  if (!input) return "";
  const sanitized = sanitizeString(input);
  // Allow letters, spaces, punctuation, and line breaks
  return sanitized
    .replace(/[^a-zA-Z0-9\s\-.,!?\n():'""अ-ह०-९]/g, "")
    .slice(0, 1000);
}

/**
 * Validate service selection
 */
export function validateService(
  service: string,
  allowedServices: string[]
): {
  isValid: boolean;
  sanitized: string;
} {
  const sanitized = sanitizeString(service);
  const isValid = allowedServices.some(
    (s) => s.toLowerCase() === sanitized.toLowerCase()
  );

  return { isValid, sanitized };
}

/**
 * Validate vehicle type selection
 */
export function validateVehicleType(
  vehicleType: string,
  allowedTypes: string[]
): {
  isValid: boolean;
  sanitized: string;
} {
  const sanitized = sanitizeString(vehicleType);
  const isValid = allowedTypes.some(
    (t) => t.toLowerCase() === sanitized.toLowerCase()
  );

  return { isValid, sanitized };
}

/**
 * Comprehensive booking form validation
 */
export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  carModel: string;
  service: string;
  vehicleType: string;
  date: string;
  timeSlot: string;
  notes?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: Partial<BookingFormData>;
}

export function validateBookingForm(
  data: BookingFormData,
  allowedServices: string[],
  allowedVehicles: string[]
): ValidationResult {
  const errors: Record<string, string> = {};
  const sanitized: Partial<BookingFormData> = {};

  // Validate name
  const sanitizedName = sanitizeName(data.name);
  if (!sanitizedName || sanitizedName.length < 2) {
    errors.name = "Name is required and must be at least 2 characters";
  } else {
    sanitized.name = sanitizedName;
  }

  // Validate email when provided
  if (data.email.trim()) {
    const emailValidation = validateAndSanitizeEmail(data.email);
    if (!emailValidation.isValid) {
      errors.email = "Please enter a valid email address";
    } else {
      sanitized.email = emailValidation.sanitized;
    }
  }

  // Validate phone
  const phoneValidation = validateAndSanitizePhone(data.phone);
  if (!phoneValidation.isValid) {
    errors.phone = "Please enter a valid Indian phone number";
  } else {
    sanitized.phone = phoneValidation.sanitized;
  }

  // Validate car model
  const sanitizedCar = sanitizeVehicleDetails(data.carModel);
  if (!sanitizedCar || sanitizedCar.length < 2) {
    errors.carModel = "Car model is required";
  } else {
    sanitized.carModel = sanitizedCar.slice(0, 100);
  }

  // Validate service
  const serviceValidation = validateService(data.service, allowedServices);
  if (!serviceValidation.isValid) {
    errors.service = "Invalid service selected";
  } else {
    sanitized.service = serviceValidation.sanitized;
  }

  // Validate vehicle type
  const vehicleValidation = validateVehicleType(data.vehicleType, allowedVehicles);
  if (!vehicleValidation.isValid) {
    errors.vehicleType = "Invalid vehicle type selected";
  } else {
    sanitized.vehicleType = vehicleValidation.sanitized;
  }

  // Validate date
  const dateValidation = validateDate(data.date);
  if (!dateValidation.isValid) {
    errors.date = "Please select a valid future date";
  } else {
    sanitized.date = dateValidation.sanitized;
  }

  // Validate time slot
  const timeValidation = validateTimeSlot(data.timeSlot);
  if (!timeValidation.isValid) {
    errors.timeSlot = "Invalid time slot";
  } else {
    sanitized.timeSlot = timeValidation.sanitized;
  }

  // Validate notes (optional)
  if (data.notes) {
    sanitized.notes = sanitizeNotes(data.notes);
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

/**
 * Rate limiting helper for client-side submission throttling
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside window
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs);

    if (recentAttempts.length < this.maxAttempts) {
      recentAttempts.push(now);
      this.attempts.set(key, recentAttempts);
      return true;
    }

    return false;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  getRemainingTime(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;

    const oldestAttempt = Math.min(...attempts);
    const timeUntilReset = oldestAttempt + this.windowMs - Date.now();
    return Math.max(0, timeUntilReset);
  }
}

export const bookingLimiter = new RateLimiter(3, 300000); // 3 attempts per 5 minutes
