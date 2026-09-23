export interface Booking {
  id: string;
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

export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby4kXssusJyisJUQVSELXJCUlaqghgEQDztjMlGu4zePhfobdcUwXhh6sYzudN8Kdgp/exec";

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
  "Coatings",
  "Body Kits",
  "Premium Infotainment Systems",
  "Accessories",
  "Gold Package",
  "Automatic Car Wash"
];

interface ApiResponse {
  status?: string;
  message?: string;
  bookedSlots?: string[];
  bookings?: unknown[];
  data?: unknown[];
}

interface DeleteDetailsPayload {
  phone: string;
  date: string;
  timeSlot: string;
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

async function postScriptPayload(payload: Record<string, unknown>): Promise<ApiResponse> {
  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect: "follow",
  });

  const data = await readApiResponse(response);
  if (!response.ok || (data.status && data.status !== "success")) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function normalizeBooking(rawBooking: unknown): Booking | null {
  if (!rawBooking || typeof rawBooking !== "object") return null;

  const booking = rawBooking as Record<string, unknown>;
  const date = String(booking.date ?? "");
  const timeSlot = String(booking.timeSlot ?? booking.time ?? "");
  const phone = String(booking.phone ?? "");

  if (!date || !timeSlot) return null;

  const idValue = booking.id ?? booking.bookingId ?? booking.rowNumber ?? `${date}-${timeSlot}-${phone}`;
  const status = booking.status === "completed" ? "completed" : "booked";

  return {
    id: String(idValue),
    name: String(booking.name ?? ""),
    email: String(booking.email ?? booking.mail ?? ""),
    phone,
    carModel: String(booking.carModel ?? booking.car_model ?? ""),
    serviceType: String(booking.serviceType ?? booking.service ?? ""),
    date,
    timeSlot,
    status,
    createdAt: String(booking.createdAt ?? booking.created_at ?? new Date().toISOString()),
    rowNumber:
      typeof booking.rowNumber === "number"
        ? booking.rowNumber
        : typeof booking.row_number === "number"
        ? booking.row_number
        : undefined,
  };
}

function normalizeDateToken(value: string): string {
  const input = value.trim();
  if (!input) return "";

  const normalized = input.replace(/\//g, "-");
  const parts = normalized.split("-");
  if (parts.length !== 3) return normalized;

  const [a, b, c] = parts;
  // Convert dd-mm-yyyy to yyyy-mm-dd when user/sheet date format differs.
  if (a.length <= 2 && c.length === 4) {
    return `${c.padStart(4, "0")}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
  }

  return `${a.padStart(4, "0")}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
}

function slotsFromBookings(bookings: Booking[], date: string): string[] {
  const normalizedTargetDate = normalizeDateToken(date);
  return bookings
    .filter((booking) => booking.status === "booked")
    .filter((booking) => normalizeDateToken(booking.date) === normalizedTargetDate)
    .map((booking) => booking.timeSlot);
}

export async function getBookedSlots(date: string): Promise<string[]> {
  let slotsFromGetSlots: string[] = [];

  try {
    const response = await fetch(
      `${SCRIPT_URL}?action=getSlots&date=${encodeURIComponent(date)}&_ts=${Date.now()}`,
      { cache: "no-store" }
    );

    if (response.ok) {
      const data = await readApiResponse(response);
      slotsFromGetSlots = Array.isArray(data.bookedSlots) ? data.bookedSlots : [];
    }
  } catch {
    // Try bookings endpoint below as fallback source of truth.
  }

  try {
    const bookings = await getBookings();
    const fromBookings = slotsFromBookings(bookings, date);
    return fromBookings;
  } catch {
    if (slotsFromGetSlots.length > 0) {
      return slotsFromGetSlots;
    }
    throw new Error("Failed to fetch slots");
  }
}

export async function getAvailableSlots(date: string): Promise<{ slot: string; available: boolean }[]> {
  const booked = await getBookedSlots(date);
  return TIME_SLOTS.map((slot) => ({
    slot,
    available: !booked.includes(slot),
  }));
}

export async function getBookings(): Promise<Booking[]> {
  const response = await fetch(`${SCRIPT_URL}?action=getBookings&_ts=${Date.now()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }

  const data = await readApiResponse(response);
  const rows = Array.isArray(data.bookings) ? data.bookings : Array.isArray(data.data) ? data.data : [];

  return rows
    .map((row) => normalizeBooking(row))
    .filter((row): row is Booking => Boolean(row));
}

export async function deleteBooking(id: string): Promise<void> {
  const rowNumber = Number(id);
  const payload = {
    action: "deleteBooking",
    id,
    bookingId: id,
    rowNumber: Number.isFinite(rowNumber) ? rowNumber : undefined,
  };

  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect: "follow",
  });

  const data = await readApiResponse(response);
  if (!response.ok || (data.status && data.status !== "success")) {
    throw new Error(data.message || "Failed to delete booking");
  }
}

export async function deleteBookingByDetails(payload: {
  phone: string;
  date: string;
  timeSlot: string;
}): Promise<void> {
  const body: DeleteDetailsPayload = {
    phone: payload.phone,
    date: payload.date,
    timeSlot: payload.timeSlot,
  };

  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "deleteBookingByDetails",
      phone: body.phone,
      date: body.date,
      time: body.timeSlot,
      timeSlot: body.timeSlot,
    }),
    redirect: "follow",
  });

  const data = await readApiResponse(response);
  if (!response.ok || (data.status && data.status !== "success")) {
    throw new Error(data.message || "Failed to cancel booking");
  }
}

export async function markCompleted(id: string): Promise<void> {
  const rowNumber = Number(id);
  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "markCompleted",
      id,
      bookingId: id,
      rowNumber: Number.isFinite(rowNumber) ? rowNumber : undefined,
    }),
    redirect: "follow",
  });

  const data = await readApiResponse(response);
  if (!response.ok || (data.status && data.status !== "success")) {
    throw new Error(data.message || "Failed to mark booking completed");
  }
}

export function getFriendlyError(error: unknown, fallback: string): string {
  return toErrorMessage(error, fallback);
}
