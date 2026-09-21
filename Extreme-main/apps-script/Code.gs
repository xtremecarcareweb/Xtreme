const SPREADSHEET_ID = "1W7esU9b7ALK24XHOTjRoMv1LcGMayivzfQNHIwy3-yI";
const SHEET_NAME = "Bookings";
const SHEET_GID = 1806084883;
const SENDER_EMAIL = "mohan04032007m@gmail.com";

// Admin authentication token for protected operations
// WARNING: Change this token and store it securely. Use environment variables in production.
const ADMIN_AUTH_TOKEN = "your_admin_token_here_change_in_production";

const DENT_PRICE = 500;

const SERVICE_CATALOG = [
  { service_id: "SVC010", service_name: "Business Class Customisation", base_price: 50000 },
  { service_id: "SVC011", service_name: "Full Car Customisation", base_price: 40000 },
  { service_id: "SVC001", service_name: "Paint Protection Film (PPF)", base_price: 25000 },
  { service_id: "SVC002", service_name: "Coatings", base_price: 15000 },
  { service_id: "SVC012", service_name: "Body Kits", base_price: 35000 },
  { service_id: "SVC013", service_name: "Premium Infotainment Systems", base_price: 30000 },
  { service_id: "SVC005", service_name: "Accessories", base_price: 1500 },
  { service_id: "SVC014", service_name: "Gold Package", base_price: 60000 },
  { service_id: "SVC015", service_name: "Automatic Car Wash", base_price: 2000 },
];

const VEHICLE_TYPES = [
  { vehicle_type_id: "VT001", vehicle_type: "Sedan", price_multiplier: 1.0 },
  { vehicle_type_id: "VT002", vehicle_type: "SUV", price_multiplier: 1.3 },
  { vehicle_type_id: "VT003", vehicle_type: "Sports Car", price_multiplier: 1.5 },
  { vehicle_type_id: "VT004", vehicle_type: "Truck", price_multiplier: 1.4 },
];

const ADDON_CATALOG = [
  { addon_id: "ADD001", addon_name: "Interior Cleaning", price: 1500 },
  { addon_id: "ADD002", addon_name: "Wheel Coating", price: 2000 },
  { addon_id: "ADD003", addon_name: "Headlight Restoration", price: 1800 },
];

const ALL_SLOTS = ["09:00", "10:30", "12:00", "14:00", "16:00", "18:00"];

function isValidAdminToken(token) {
  if (!token) return false;
  return String(token).trim() === String(ADMIN_AUTH_TOKEN).trim();
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ok(data, message) {
  return jsonResponse({
    success: true,
    status: "success",
    message: message || "OK",
    data: data || null,
  });
}

function fail(message, data) {
  return jsonResponse({
    success: false,
    status: "error",
    message: message || "Request failed",
    error: message || "Request failed",
    data: data || null,
  });
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheets().find((s) => s.getSheetId() === SHEET_GID);
  if (!sheet) sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("Bookings sheet not found");
  return sheet;
}

function clean(v) {
  return String(v || "").trim();
}

function normalizePhone(v) {
  return clean(v).replace(/\D/g, "").slice(-10);
}

function normalizeDate(v) {
  const s = clean(v).replace(/\//g, "-");
  if (!s) return "";

  const parts = s.split("-");
  if (parts.length !== 3) return s;

  const a = parts[0];
  const b = parts[1];
  const c = parts[2];

  // dd-mm-yyyy -> yyyy-mm-dd
  if (a.length <= 2 && c.length === 4) {
    return [c.padStart(4, "0"), b.padStart(2, "0"), a.padStart(2, "0")].join("-");
  }

  return [a.padStart(4, "0"), b.padStart(2, "0"), c.padStart(2, "0")].join("-");
}

function normalizeTime(v) {
  return clean(v).replace(/\s+/g, " ").toUpperCase();
}

function splitCsv(value) {
  return clean(value)
    .split(",")
    .map((x) => clean(x))
    .filter(Boolean);
}

function isValidEmail(value) {
  const email = clean(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ensureHeaderRow(sh) {
  if (sh.getLastRow() === 0) {
    sh.appendRow(["name", "email", "phone", "car_model", "service", "date", "time", "status", "created_at"]);
    return;
  }

  const lastColumn = Math.max(sh.getLastColumn(), 9);
  const header = sh.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(clean);

  if (header[0] === "name" && header[1] === "email" && header[2] === "phone") {
    return;
  }

  sh.getRange(1, 1, 1, 9).setValues([
    ["name", "email", "phone", "car_model", "service", "date", "time", "status", "created_at"],
  ]);
}

function sendBookingEmail(email, booking) {
  const recipient = clean(email);
  if (!recipient) {
    return { sent: false, reason: "Missing recipient email" };
  }

  if (!isValidEmail(recipient)) {
    return { sent: false, reason: "Invalid recipient email format" };
  }

  const remainingQuota = MailApp.getRemainingDailyQuota();
  if (remainingQuota <= 0) {
    return { sent: false, reason: "Daily email quota exhausted" };
  }

  const subject = "Xtreme Car Care Booking Confirmation";
  const priceInfo = booking.price ? "Estimated Price: ₹" + booking.price + "\n" : "";
  const body =
    "Dear " + booking.name + ",\n\n" +
    "Thank you for booking with Xtreme Car Care.\n\n" +
    "Your appointment has been confirmed successfully.\n\n" +
    "Booking Details\n" +
    "Name: " + booking.name + "\n" +
    "Email: " + booking.email + "\n" +
    "Phone: " + booking.phone + "\n" +
    "Service: " + booking.service + "\n" +
    "Car Model: " + booking.carModel + "\n" +
    "Date: " + booking.date + "\n" +
    "Time Slot: " + booking.time + "\n" +
    priceInfo +
    "\nIf you need to reschedule or cancel your booking, please contact us in advance.\n\n" +
    "Thank you for choosing Xtreme Car Care.\n\n" +
    "Regards,\n" +
    "Xtreme Car Care\n" +
    "Chennai\n" +
    "Phone: +91 98841 49111";

  try {
    const aliases = GmailApp.getAliases();
    const canUseConfiguredSender = aliases.indexOf(SENDER_EMAIL) !== -1;

    const options = {
      name: "Xtreme Car Care",
      replyTo: SENDER_EMAIL,
    };

    if (canUseConfiguredSender) {
      options.from = SENDER_EMAIL;
    }

    GmailApp.sendEmail(recipient, subject, body, options);

    if (canUseConfiguredSender) {
      return { sent: true, reason: "sent_from_configured_sender" };
    }

    return { sent: true, reason: "sent_from_account_default_sender_alias_not_found" };
  } catch (error) {
    const msg = error && error.message ? error.message : String(error);
    Logger.log("Email send failed: " + msg);
    return { sent: false, reason: msg };
  }
}

function testEmailDelivery(toEmail) {
  const recipient = clean(toEmail);
  if (!recipient) {
    return fail("Provide recipient email");
  }

  const testBooking = {
    name: "Test User",
    email: recipient,
    phone: "9999999999",
    carModel: "Test Car",
    service: "Test Service",
    date: "2026-03-15",
    time: "10:30",
  };

  const result = sendBookingEmail(recipient, testBooking);
  return ok(result, "Test email attempted");
}

function doGet(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    const action = clean(p.action);

    if (action === "getServices") return ok(SERVICE_CATALOG);
    if (action === "getVehicleTypes") return ok(VEHICLE_TYPES);
    if (action === "getAddons") return ok(ADDON_CATALOG);
    if (action === "getSlots") return handleGetSlots(p);
    if (action === "getBookings") return handleGetBookings();
    if (action === "calculatePrice") return handleCalculatePrice(p);
    if (action === "createBooking" || action === "book") return handleBook(p);

    return fail("Invalid request action");
  } catch (error) {
    return fail(error && error.message ? error.message : String(error));
  }
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    let body = {};

    try {
      body = JSON.parse(raw);
    } catch (_) {
      return fail("Invalid JSON body");
    }

    const action = clean(body.action);

    if (action === "deleteBooking") return handleDeleteBooking(body);
    if (action === "deleteBookingByDetails") return handleDeleteByDetails(body);
    if (action === "markCompleted") return handleMarkCompleted(body);
    if (action === "create_booking" || action === "createBooking" || action === "book") return handleBook(body);

    // Keep backward compatibility: no action means create booking.
    return handleBook(body);
  } catch (error) {
    return fail(error && error.message ? error.message : String(error));
  }
}

function handleCalculatePrice(p) {
  const selectedServices = splitCsv(p.service || p.services);
  const vehicleType = clean(p.vehicleType || p.vehicle_type);
  const dents = parseInt(clean(p.dents), 10) || 0;
  const selectedAddons = splitCsv(p.addons);

  const basePrice = selectedServices.reduce((sum, serviceName) => {
    const service = SERVICE_CATALOG.find((s) => s.service_name === serviceName);
    return sum + (service ? service.base_price : 0);
  }, 0);

  const vehicle = VEHICLE_TYPES.find((v) => v.vehicle_type === vehicleType);
  const multiplier = vehicle ? Number(vehicle.price_multiplier) : 1;

  const addonTotal = selectedAddons.reduce((sum, addonName) => {
    const addon = ADDON_CATALOG.find((a) => a.addon_name === addonName);
    return sum + (addon ? Number(addon.price) : 0);
  }, 0);

  const serviceTotal = basePrice * multiplier;
  const dentTotal = dents * DENT_PRICE;
  const totalPrice = serviceTotal + dentTotal + addonTotal;

  return ok({
    basePrice: basePrice,
    multiplier: multiplier,
    serviceTotal: serviceTotal,
    dentCount: dents,
    dentPrice: DENT_PRICE,
    dentTotal: dentTotal,
    addonTotal: addonTotal,
    totalPrice: totalPrice,
  });
}

function handleGetSlots(p) {
  const reqDate = normalizeDate(clean(p.date));
  if (!reqDate) return fail("Missing date");

  const sh = getSheet();
  ensureHeaderRow(sh);

  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    const allAvailable = ALL_SLOTS.map((time) => ({ time: time, available: true }));
    return jsonResponse({
      success: true,
      status: "success",
      bookedSlots: [],
      data: allAvailable,
      message: "OK",
    });
  }

  const rows = sh.getRange(2, 1, lastRow - 1, 9).getDisplayValues();
  const bookedSlots = rows
    .filter((r) => normalizeDate(r[5]) === reqDate)
    .filter((r) => clean(r[7]) !== "completed")
    .map((r) => clean(r[6]))
    .filter(Boolean);

  const slots = ALL_SLOTS.map((time) => ({
    time: time,
    available: bookedSlots.indexOf(time) === -1,
  }));

  return jsonResponse({
    success: true,
    status: "success",
    bookedSlots: bookedSlots,
    data: slots,
    message: "OK",
  });
}

function handleGetBookings() {
  const sh = getSheet();
  ensureHeaderRow(sh);

  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    return jsonResponse({
      success: true,
      status: "success",
      bookings: [],
      data: [],
      message: "OK",
    });
  }

  const rows = sh.getRange(2, 1, lastRow - 1, 9).getDisplayValues();
  const bookings = rows
    .filter((r) => r.some((cell) => clean(cell)))
    .map((r, i) => ({
      id: String(i + 2),
      rowNumber: i + 2,
      name: clean(r[0]),
      email: clean(r[1]),
      phone: clean(r[2]),
      car_model: clean(r[3]),
      carModel: clean(r[3]),
      service: clean(r[4]),
      serviceType: clean(r[4]),
      date: clean(r[5]),
      time: clean(r[6]),
      timeSlot: clean(r[6]),
      status: clean(r[7]) === "completed" ? "completed" : "booked",
      createdAt: clean(r[8]),
      created_at: clean(r[8]),
    }));

  return jsonResponse({
    success: true,
    status: "success",
    bookings: bookings,
    data: bookings,
    message: "OK",
  });
}

function handleBook(body) {
  const name = clean(body.customerName || body.name);
  const email = clean(body.customerEmail || body.email);
  const phone = clean(body.phone);
  const carModel = clean(body.carModel || body.car_model);
  const service = clean(body.servicePackage || body.service || body.services);
  const date = normalizeDate(clean(body.date));
  const time = normalizeTime(clean(body.slot || body.timeSlot || body.time));
  const vehicleType = clean(body.vehicleType || body.vehicle_type);

  if (!name || !phone || !service || !date || !time) {
    return fail("Missing required fields");
  }

  const sh = getSheet();
  ensureHeaderRow(sh);

  const lr = sh.getLastRow();
  if (lr > 1) {
    const rows = sh.getRange(2, 1, lr - 1, 9).getDisplayValues();
    const exists = rows.some(
      (r) =>
        normalizeDate(r[5]) === date &&
        normalizeTime(r[6]) === time &&
        clean(r[7]) !== "completed"
    );

    if (exists) {
      return fail("Slot already booked");
    }
  }

  sh.appendRow([name, email, phone, carModel, service, date, time, "booked", new Date()]);

  // Server-side price calculation - ignore any client-submitted price
  const selectedServices = String(service || "")
    .split(",")
    .map((s) => clean(s))
    .filter(Boolean);
  const basePrice = selectedServices.reduce((sum, serviceName) => {
    const svc = SERVICE_CATALOG.find((s) => s.service_name === serviceName);
    return sum + (svc ? svc.base_price : 0);
  }, 0);

  const vehicle = VEHICLE_TYPES.find((v) => v.vehicle_type === vehicleType);
  const multiplier = vehicle ? Number(vehicle.price_multiplier) : 1;
  const calculatedPrice = basePrice * multiplier;

  const shouldSendEmail =
    String(body.sendEmail || body.notifyCustomer || body.confirmationEmail || "true").toLowerCase() !== "false";

  let emailSent = false;
  let emailStatus = "not_requested";

  if (shouldSendEmail) {
    const mail = sendBookingEmail(email, {
      name: name,
      email: email,
      phone: phone,
      carModel: carModel,
      service: service,
      date: date,
      time: time,
      price: calculatedPrice,
    });
    emailSent = mail.sent === true;
    emailStatus = mail.reason;
  }

  const bookingId = "BK-" + Utilities.getUuid().slice(0, 8).toUpperCase();

  return jsonResponse({
    success: true,
    status: "success",
    message: "Booking confirmed!",
    bookingId: bookingId,
    data: {
      bookingId: bookingId,
      service: service,
      vehicleType: vehicleType,
      date: date,
      timeSlot: time,
      price: calculatedPrice,
      status: "Confirmed",
      message: "Booking confirmed successfully!",
      emailSent: emailSent,
      emailStatus: emailStatus,
    },
  });
}

function handleDeleteBooking(body) {
  // Validate admin token
  if (!isValidAdminToken(body.adminAuthToken)) {
    return fail("Unauthorized: Invalid or missing admin token");
  }

  const rowNumber = parseInt(body.rowNumber || body.id, 10);
  const sh = getSheet();
  ensureHeaderRow(sh);

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return fail("No bookings found");

  if (!isNaN(rowNumber) && rowNumber >= 2 && rowNumber <= lastRow) {
    sh.deleteRow(rowNumber);
    return ok(null, "Booking deleted");
  }

  return fail("Booking not found");
}

function handleDeleteByDetails(body) {
  // Validate admin token
  if (!isValidAdminToken(body.adminAuthToken)) {
    return fail("Unauthorized: Invalid or missing admin token");
  }

  const phone = normalizePhone(clean(body.phone));
  const date = normalizeDate(clean(body.date));
  const time = normalizeTime(clean(body.time || body.timeSlot));

  Logger.log("Delete request: phone=%s, date=%s, time=%s", phone, date, time);

  if (!phone || !date || !time) {
    Logger.log("Missing phone, date, or time");
    return fail("Missing phone, date or time");
  }

  const sh = getSheet();
  ensureHeaderRow(sh);

  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    Logger.log("No bookings found in sheet");
    return fail("No bookings found");
  }

  const rows = sh.getRange(2, 1, lastRow - 1, 9).getDisplayValues();

  for (let i = rows.length - 1; i >= 0; i--) {
    const rowPhone = normalizePhone(rows[i][2]);
    const rowDate = normalizeDate(rows[i][5]);
    const rowTime = normalizeTime(rows[i][6]);
    Logger.log("Comparing row %d: rowPhone=%s, rowDate=%s, rowTime=%s", i+2, rowPhone, rowDate, rowTime);
    if (rowPhone === phone && rowDate === date && rowTime === time) {
      Logger.log("Match found at row %d. Deleting row.", i+2);
      sh.deleteRow(i + 2);
      return ok(null, "Booking cancelled");
    }
  }

  Logger.log("No matching booking found for deletion");
  return fail("Booking not found");
}

function handleMarkCompleted(body) {
  // Validate admin token
  if (!isValidAdminToken(body.adminAuthToken)) {
    return fail("Unauthorized: Invalid or missing admin token");
  }

  const rowNumber = parseInt(body.rowNumber || body.id, 10);
  const sh = getSheet();
  ensureHeaderRow(sh);

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return fail("No bookings found");

  if (!isNaN(rowNumber) && rowNumber >= 2 && rowNumber <= lastRow) {
    sh.getRange(rowNumber, 8).setValue("completed");
    return ok(null, "Marked completed");
  }

  return fail("Booking not found");
}
