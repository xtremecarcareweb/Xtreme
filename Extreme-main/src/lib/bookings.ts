import { API_URL } from "@/lib/config";

export interface Booking {
  id: string;
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  carModel: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  status: "booked" | "completed";
  createdAt: string;
  rowNumber?: number;
}

export const TIME_SLOTS = [
  "09:00",
  "10:30",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
];

export const SERVICES = [
  "Business Class Customisation",
  "Full Car Customisation",
  "Paint Protection Film (PPF)",
  "Ceramic Coating",
  "Body Kits",
  "Premium Infotainment Systems",
  "Accessories",
  "Gold Package",
  "Automatic Car Wash"
];

interface ApiResponse {
  status?: string;
  code?: number;
  message?: string;
  bookedSlots?: string[];
  bookings?: unknown[];
  data?: unknown;
}

// Thrown when the backend rejects the admin session (HTTP-401 equivalent).
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function readApiResponse(response: Response): Promise<ApiResponse> {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw) as ApiResponse;
  } catch {
    throw new Error("Invalid API response");
  }
}

// POSTs an action to the backend. Credentials (password, session token) travel in the body,
// never in the URL, so they do not end up in request logs.
async function postAction(payload: Record<string, unknown>, fallbackError: string): Promise<ApiResponse> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect: "follow",
  });

  const data = await readApiResponse(response);
  if (data.code === 401) {
    throw new UnauthorizedError(data.message || "Unauthorized");
  }
  if (!response.ok || (data.status && data.status !== "success")) {
    throw new Error(data.message || fallbackError);
  }

  return data;
}

function postAdminAction(payload: Record<string, unknown>, sessionToken: string, fallbackError: string) {
  return postAction({ ...payload, adminAuthToken: sessionToken }, fallbackError);
}

function normalizeBooking(rawBooking: unknown): Booking | null {
  if (!rawBooking || typeof rawBooking !== "object") return null;

  const booking = rawBooking as Record<string, unknown>;
  const date = String(booking.date ?? "");
  const timeSlot = String(booking.timeSlot ?? booking.time ?? "");
  const bookingId = String(booking.bookingId ?? booking.id ?? "");

  if (!date || !timeSlot || !bookingId) return null;

  const status = booking.status === "completed" ? "completed" : "booked";

  return {
    id: bookingId,
    bookingId,
    name: String(booking.name ?? ""),
    email: String(booking.email ?? booking.mail ?? ""),
    phone: String(booking.phone ?? ""),
    carModel: String(booking.carModel ?? booking.car_model ?? ""),
    serviceType: String(booking.serviceType ?? booking.service ?? ""),
    date,
    timeSlot,
    status,
    createdAt: String(booking.createdAt ?? booking.created_at ?? ""),
    rowNumber:
      typeof booking.rowNumber === "number"
        ? booking.rowNumber
        : typeof booking.row_number === "number"
        ? booking.row_number
        : undefined,
  };
}

// Sends the typed admin password to the backend. Resolves to a session token on success,
// or null when the password is wrong. Throws only on network/service errors.
export async function loginAdmin(password: string): Promise<string | null> {
  try {
    const data = await postAction({ action: "verifyAdmin", password }, "Could not verify password");
    const payload = (data.data ?? {}) as { sessionToken?: unknown };
    return typeof payload.sessionToken === "string" && payload.sessionToken ? payload.sessionToken : null;
  } catch (error) {
    if (error instanceof UnauthorizedError) return null;
    throw error;
  }
}

// Ends the admin session on the server. Failures are ignored; the caller clears local state anyway.
export async function logoutAdmin(sessionToken: string): Promise<void> {
  try {
    await postAction({ action: "logoutAdmin", adminAuthToken: sessionToken }, "Logout failed");
  } catch {
    // The token expires on its own after 6 hours.
  }
}

export async function getBookings(sessionToken: string): Promise<Booking[]> {
  const data = await postAdminAction({ action: "getBookings" }, sessionToken, "Failed to fetch bookings");
  const rows = Array.isArray(data.bookings) ? data.bookings : Array.isArray(data.data) ? data.data : [];

  return rows
    .map((row) => normalizeBooking(row))
    .filter((row): row is Booking => Boolean(row));
}

export async function deleteBooking(bookingId: string, sessionToken: string): Promise<void> {
  await postAdminAction({ action: "deleteBooking", bookingId }, sessionToken, "Failed to delete booking");
}

export async function markCompleted(bookingId: string, sessionToken: string): Promise<void> {
  await postAdminAction({ action: "markCompleted", bookingId }, sessionToken, "Failed to mark booking completed");
}

// Customer self-cancellation: verified on the server by booking ID + the phone used to book.
// No admin credentials involved.
export async function cancelBooking(payload: { phone: string; bookingId: string }): Promise<void> {
  await postAction(
    { action: "cancelBooking", phone: payload.phone, bookingId: payload.bookingId },
    "Failed to cancel booking"
  );
}

export function getFriendlyError(error: unknown, fallback: string): string {
  return toErrorMessage(error, fallback);
}
