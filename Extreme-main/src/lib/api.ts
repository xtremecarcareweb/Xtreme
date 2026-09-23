export interface BookingRequest {
  name: string;
  phone: string;
  vehicleType: string;
  servicePackage: string;
  date: string;
  slot: string;
  email?: string;
  carModel?: string;
  notes?: string;
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
  message?: string;
  bookingId?: string;
  data?: Record<string, unknown>;
}

const API_URL = (import.meta.env.VITE_API_URL || "").trim();

export async function createBooking(request: BookingRequest): Promise<BookingApiResult> {
  if (!API_URL) {
    if (import.meta.env.DEV) {
      console.warn("[Booking API] VITE_API_URL is empty. Running in local demo mode.");
    }
    return {
      success: true,
      bookingId: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
      data: {
        bookingId: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
        ...request,
        status: "Confirmed",
        message: "Demo booking confirmed successfully.",
      },
    };
  }

  const payload = {
    action: "create_booking",
    name: request.name,
    customerName: request.name,
    phone: request.phone,
    email: request.email || "",
    customerEmail: request.email || "",
    carModel: request.carModel || "",
    car_model: request.carModel || "",
    vehicleType: request.vehicleType,
    servicePackage: request.servicePackage,
    service: request.servicePackage,
    date: request.date,
    slot: request.slot,
    timeSlot: request.slot,
    time: request.slot,
    notes: request.notes || "",
  };

  if (import.meta.env.DEV) {
    console.info("[Booking API] Submitting booking request:", {
      endpoint: API_URL,
      method: "POST",
      payload: { ...payload, phone: payload.phone.slice(0, 3) + "****" + payload.phone.slice(-3) },
    });
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      redirect: "follow",
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);

    const raw = await response.text();

    // Check if response returned HTML instead of JSON (common with Google 404/login/error pages)
    if (raw.includes("<!DOCTYPE") || raw.includes("<html") || raw.includes("<body")) {
      if (import.meta.env.DEV) {
        console.error("[Booking API] Received HTML error page from Google Apps Script:", {
          status: response.status,
          rawPreview: raw.slice(0, 300),
        });
      }

      if (response.status === 404 || raw.includes("does not exist")) {
        return {
          success: false,
          error: "Booking service endpoint was not found (HTTP 404). Please verify that your Google Apps Script Web App URL is correctly deployed.",
        };
      }

      return {
        success: false,
        error: "The booking service returned an unexpected HTML response. Please verify Google Apps Script deployment permissions ('Who has access: Anyone').",
      };
    }

    let result: AppsScriptResponse;
    try {
      result = JSON.parse(raw) as AppsScriptResponse;
    } catch {
      if (import.meta.env.DEV) {
        console.error("[Booking API] Failed to parse JSON response:", raw);
      }
      return {
        success: false,
        error: "The booking service returned an invalid response format.",
      };
    }

    if (!response.ok || (result.status && result.status !== "success") || result.success === false) {
      const errorMsg = result.message || result.error || "The booking could not be completed.";
      
      if (errorMsg.toLowerCase().includes("slot already booked")) {
        return {
          success: false,
          error: "This time slot has already been booked. Please select another slot.",
        };
      }

      if (import.meta.env.DEV) {
        console.error("[Booking API] Server returned error:", result);
      }

      return {
        success: false,
        error: errorMsg,
      };
    }

    const bookingId = (result.bookingId || (result.data?.bookingId as string) || "BK-" + Math.floor(100000 + Math.random() * 900000));

    if (import.meta.env.DEV) {
      console.info("[Booking API] Booking confirmed successfully:", { bookingId, result });
    }

    return {
      success: true,
      bookingId,
      message: result.message || "Booking confirmed successfully",
      data: {
        ...(result.data || {}),
        bookingId,
        service: request.servicePackage,
        vehicleType: request.vehicleType,
        date: request.date,
        timeSlot: request.slot,
        name: request.name,
        phone: request.phone,
        email: request.email || "",
      },
    };
  } catch (error) {
    window.clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: "Booking request timed out. Please check your internet connection and try again.",
      };
    }

    if (import.meta.env.DEV) {
      console.error("[Booking API] Network / Fetch Exception:", error);
    }

    return {
      success: false,
      error: "Unable to reach the booking service. If you are developing locally, ensure the Apps Script Web App is deployed with 'Who has access: Anyone'.",
    };
  }
}