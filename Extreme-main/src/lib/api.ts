export interface BookingRequest {
  name: string;
  phone: string;
  vehicleType: string;
  servicePackage: string;
  date: string;
  slot: string;
  email?: string;
}

interface AppsScriptResponse {
  status?: string;
  success?: boolean;
  message?: string;
  error?: string;
  bookingId?: string;
  data?: Record<string, unknown>;
}

export interface BookingApiResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

const API_URL = import.meta.env.VITE_API_URL || "";

export async function createBooking(request: BookingRequest): Promise<BookingApiResult> {
  if (!API_URL.trim()) {
    return {
      success: true,
      data: {
        bookingId: `DEMO-${Math.floor(100000 + Math.random() * 900000)}`,
        ...request,
        status: "Confirmed",
        message: "Demo booking confirmed successfully.",
      },
    };
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      redirect: "follow",
      body: JSON.stringify({
        action: "create_booking",
        ...request,
      }),
    });

    const raw = await response.text();
    let result: AppsScriptResponse;
    try {
      result = JSON.parse(raw) as AppsScriptResponse;
    } catch {
      return { success: false, error: "The booking service returned an invalid response." };
    }

    if (!response.ok || (result.status && result.status !== "success") || result.success === false) {
      return {
        success: false,
        error: result.message || result.error || "The booking could not be submitted.",
      };
    }

    return {
      success: true,
      data: {
        ...(result.data || {}),
        ...(result.bookingId ? { bookingId: result.bookingId } : {}),
        ...(result.message ? { message: result.message } : {}),
      },
    };
  } catch {
    return {
      success: false,
      error: "Unable to reach the booking service. Please try again.",
    };
  }
}