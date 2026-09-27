// Secrets are stored in Apps Script Script Properties, not in this file.
// Admin credentials are created by running setupAdminCredentials() once from the editor,
// which writes these Script Properties (the plain password itself is never stored):
//   ADMIN_USERNAME       = admin username
//   ADMIN_PASSWORD_SALT  = random UUID
//   ADMIN_PASSWORD_HASH  = sha256 hex of (salt + password)

const SPREADSHEET_ID = "1W7esU9b7ALK24XHOTjRoMv1LcGMayivzfQNHIwy3-yI";
const SHEET_NAME = "Bookings";
const SHEET_GID = 1806084883;
const SENDER_EMAIL = "mohan04032007m@gmail.com";
// Business owner inbox that receives a notification for every new booking.
const OWNER_EMAIL = SENDER_EMAIL;

// Admin sessions: a random token issued at login, stored in the script cache.
// 21600 seconds (6 hours) is the maximum lifetime CacheService allows.
const ADMIN_SESSION_TTL_SECONDS = 21600;
const ADMIN_SESSION_CACHE_PREFIX = "admin-session:";
const LOGIN_DELAY_MS = 1500;

const LOCK_WAIT_MS = 10000;

const MAX_FIELD_LENGTH = 200;
const MAX_NOTES_LENGTH = 1000;

const DENT_PRICE = 500;

const SERVICE_CATALOG = [
  { service_id: "SVC010", service_name: "Business Class Customisation", base_price: 50000 },
  { service_id: "SVC011", service_name: "Full Car Customisation", base_price: 40000 },
  { service_id: "SVC001", service_name: "Paint Protection Film (PPF)", base_price: 25000 },
  { service_id: "SVC002", service_name: "Ceramic Coating", base_price: 15000 },
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

// Sheet columns (0-based indexes into a row array)
const COL_PHONE = 2;
const COL_DATE = 5;
const COL_TIME = 6;
const COL_STATUS = 7;
const COL_BOOKING_ID = 9;
const SHEET_COLUMNS = 11;

// Compares two strings in time that depends only on their lengths, never short-circuiting
// on the first mismatch, so response timing does not reveal how much of a guess was right.
function constantTimeEquals(a, b) {
  const left = String(a);
  const right = String(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let i = 0; i < length; i++) {
    diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  }
  return diff === 0;
}

// Lowercase hex SHA-256 of a UTF-8 string.
function sha256Hex(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8);
  return bytes.map((b) => ("0" + (b & 0xff).toString(16)).slice(-2)).join("");
}

// Run ONCE from the Apps Script editor: fill in the two values below, select
// setupAdminCredentials in the toolbar and click Run. Then set them back to the
// placeholders so the password does not stay in the source.
function setupAdminCredentials() {
  const username = "CHANGE_ME";
  const password = "CHANGE_ME";

  if (username === "CHANGE_ME" || password === "CHANGE_ME" || !clean(username) || !password) {
    throw new Error("Edit username and password in setupAdminCredentials() before running it.");
  }

  const salt = Utilities.getUuid();
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    ADMIN_USERNAME: clean(username),
    ADMIN_PASSWORD_SALT: salt,
    ADMIN_PASSWORD_HASH: sha256Hex(salt + password),
  });
  // Remove the legacy plain-text password if it is still present.
  props.deleteProperty("ADMIN_PASSWORD");

  Logger.log("Admin credentials saved. Reset the values in setupAdminCredentials() to CHANGE_ME.");
}

function getAdminCredentialConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    salt: props.getProperty("ADMIN_PASSWORD_SALT") || "",
    hash: props.getProperty("ADMIN_PASSWORD_HASH") || "",
  };
}

function isCorrectAdminPassword(password) {
  const config = getAdminCredentialConfig();
  if (!config.salt || !config.hash) return false;
  const submittedHash = sha256Hex(config.salt + String(password || ""));
  return constantTimeEquals(submittedHash, config.hash.toLowerCase());
}

function sessionCacheKey(token) {
  return ADMIN_SESSION_CACHE_PREFIX + token;
}

// True when token is a live admin session issued by handleVerifyAdmin.
function validateSession(token) {
  const value = clean(token);
  if (!value) return false;
  return CacheService.getScriptCache().get(sessionCacheKey(value)) === "valid";
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

// Apps Script web apps cannot set HTTP status codes, so the 401 is carried in the body.
function unauthorized() {
  return jsonResponse({
    success: false,
    status: "error",
    code: 401,
    message: "Unauthorized",
    error: "Unauthorized",
    data: null,
  });
}

// Runs fn while holding the script lock so reads and writes to the sheet cannot interleave.
function withScriptLock(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    return fail("The booking service is busy. Please try again in a moment.");
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  let ss = null;
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE") {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (_) {
      // Fallback if standalone spreadsheet ID isn't found
    }
  }
  if (!ss) {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (_) {}
  }
  if (!ss) {
    throw new Error("Spreadsheet not accessible. Please verify SPREADSHEET_ID in Code.gs or bind the script to a Google Sheet.");
  }

  let sheet = null;
  if (typeof SHEET_GID === "number" && SHEET_GID > 0) {
    sheet = ss.getSheets().find((s) => s.getSheetId() === SHEET_GID);
  }
  if (!sheet) {
    sheet = ss.getSheetByName(SHEET_NAME);
  }
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function clean(v) {
  return String(v || "").trim();
}

// Neutralises spreadsheet formula injection without altering the value: a leading apostrophe
// makes Google Sheets store the cell as plain text, so "=..." is never evaluated and values
// like "+91 98765 43210", "2026-10-01" or "09:00" are not converted to numbers/dates/times.
// The apostrophe is not part of the stored value and does not appear in getDisplayValues().
function sanitizeForSheet(value) {
  const text = clean(value);
  return text ? "'" + text : "";
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

// Converts time values into canonical 24-hour "HH:MM", e.g. "9:00 AM" -> "09:00",
// "2:00 PM" -> "14:00", "12:00 AM" -> "00:00", "09:00:00" -> "09:00", "6 pm" -> "18:00".
// Values that cannot be parsed are returned trimmed and uppercased, as before.
function normalizeTime(v) {
  const s = clean(v).replace(/\s+/g, " ").toUpperCase();
  const m = s.match(/^(\d{1,2})(?:[:.](\d{2}))?(?::(\d{2}))?\s*(A\.?M\.?|P\.?M\.?)?$/);
  if (!m) return s;

  let hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const meridiem = m[4] ? m[4].charAt(0) : "";

  if (!m[2] && !meridiem) return s; // a bare number like "9" is ambiguous
  if (minutes > 59) return s;

  if (meridiem) {
    if (hours < 1 || hours > 12) return s;
    if (meridiem === "A" && hours === 12) hours = 0;
    if (meridiem === "P" && hours !== 12) hours += 12;
  } else if (hours > 23) {
    return s;
  }

  return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
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

function getTodayInScriptTimeZone() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function calculateServicePrice(selectedServices, vehicleType) {
  const basePrice = selectedServices.reduce((sum, serviceName) => {
    const service = SERVICE_CATALOG.find((s) => s.service_name === serviceName);
    return sum + (service ? service.base_price : 0);
  }, 0);

  const vehicle = VEHICLE_TYPES.find((v) => v.vehicle_type === vehicleType);
  const multiplier = vehicle ? Number(vehicle.price_multiplier) : 1;

  return {
    basePrice: basePrice,
    multiplier: multiplier,
    serviceTotal: Math.round(basePrice * multiplier),
  };
}

function formatPrice(value) {
  return Math.round(Number(value) || 0).toLocaleString("en-IN");
}

function ensureHeaderRow(sh) {
  if (sh.getLastRow() === 0) {
    sh.appendRow(["name", "email", "phone", "car_model", "service", "date", "time", "status", "created_at", "booking_id", "notes"]);
    return;
  }

  const lastColumn = Math.max(sh.getLastColumn(), SHEET_COLUMNS);
  const header = sh.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(clean);

  if (header[0] === "name" && header[1] === "email" && header[2] === "phone") {
    return;
  }

  sh.getRange(1, 1, 1, SHEET_COLUMNS).setValues([
    ["name", "email", "phone", "car_model", "service", "date", "time", "status", "created_at", "booking_id", "notes"],
  ]);
}

function generateBookingId() {
  return "BK-" + Utilities.getUuid().slice(0, 8).toUpperCase();
}

// Returns the 1-based sheet row number for a booking_id, or -1 when not found.
function findRowByBookingId(sh, bookingId) {
  const target = clean(bookingId).toUpperCase();
  if (!target) return -1;

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return -1;

  const ids = sh.getRange(2, COL_BOOKING_ID + 1, lastRow - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) {
    if (clean(ids[i][0]).toUpperCase() === target) {
      return i + 2;
    }
  }
  return -1;
}

function sendBookingEmail(email, booking) {
  const recipient = clean(email);
  if (!recipient) {
    return { sent: false, reason: "Missing recipient email" };
  }

  if (!isValidEmail(recipient)) {
    return { sent: false, reason: "Invalid recipient email format" };
  }

  const subject = "Xtreme Car Care Booking Confirmation";
  const priceInfo = booking.price ? "Estimated Price: ₹" + formatPrice(booking.price) + "\n" : "";
  const body =
    "Dear " + booking.name + ",\n\n" +
    "Thank you for booking with Xtreme Car Care.\n\n" +
    "Your appointment has been confirmed successfully.\n\n" +
    "Booking Details\n" +
    "Booking ID: " + booking.bookingId + "\n" +
    "Name: " + booking.name + "\n" +
    "Email: " + booking.email + "\n" +
    "Phone: " + booking.phone + "\n" +
    "Service: " + booking.service + "\n" +
    "Vehicle: " + booking.vehicleType + "\n" +
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
    const remainingQuota = MailApp.getRemainingDailyQuota();
    if (remainingQuota <= 0) {
      return { sent: false, reason: "Daily email quota exhausted" };
    }

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
    return { sent: false, reason: "email_send_failed" };
  }
}

function sendOwnerNotification(booking) {
  if (!isValidEmail(OWNER_EMAIL)) {
    return { sent: false, reason: "Owner email not configured" };
  }

  const subject = "New Booking: " + booking.name + " – " + booking.date + " " + booking.time;
  const body =
    "A new booking has been received.\n\n" +
    "Booking ID: " + booking.bookingId + "\n" +
    "Customer Name: " + booking.name + "\n" +
    "Phone: " + booking.phone + "\n" +
    "Email: " + (booking.email || "-") + "\n" +
    "Service: " + booking.service + "\n" +
    "Vehicle: " + booking.vehicleType + "\n" +
    "Car Model: " + (booking.carModel || "-") + "\n" +
    "Date: " + booking.date + "\n" +
    "Time: " + booking.time + "\n" +
    (booking.notes ? "Notes: " + booking.notes + "\n" : "");

  try {
    if (MailApp.getRemainingDailyQuota() <= 0) {
      return { sent: false, reason: "Daily email quota exhausted" };
    }
    GmailApp.sendEmail(OWNER_EMAIL, subject, body, { name: "Xtreme Car Care Bookings" });
    return { sent: true, reason: "sent" };
  } catch (error) {
    const msg = error && error.message ? error.message : String(error);
    Logger.log("Owner notification failed: " + msg);
    return { sent: false, reason: "email_send_failed" };
  }
}

function testEmailDelivery(toEmail) {
  const recipient = clean(toEmail);
  if (!recipient) {
    return fail("Provide recipient email");
  }

  const testBooking = {
    bookingId: "BK-TEST",
    name: "Test User",
    email: recipient,
    phone: "9999999999",
    carModel: "Test Car",
    service: "Test Service",
    vehicleType: "Sedan",
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
    if (action === "getBookings") return handleGetBookings(p);
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

    if (action === "verifyAdmin") return handleVerifyAdmin(body);
    if (action === "logoutAdmin") return handleLogoutAdmin(body);
    if (action === "getBookings") return handleGetBookings(body);
    if (action === "deleteBooking") return handleDeleteBooking(body);
    if (action === "deleteBookingByDetails" || action === "cancelBooking") return handleDeleteByDetails(body);
    if (action === "markCompleted" || action === "completeBooking") return handleCompleteBooking(body);
    if (action === "create_booking" || action === "createBooking" || action === "book") return handleBook(body);

    // Keep backward compatibility: no action means create booking.
    return handleBook(body);
  } catch (error) {
    return fail(error && error.message ? error.message : String(error));
  }
}

// Admin login: checks the typed password on the server and, if correct, issues a session token.
function handleVerifyAdmin(body) {
  const config = getAdminCredentialConfig();
  if (!config.salt || !config.hash) {
    return fail("Admin login is not configured. Run setupAdminCredentials() once from the Apps Script editor.");
  }

  const correct = isCorrectAdminPassword(body.password);

  // Same delay for right and wrong answers: slows brute force and hides which case occurred.
  Utilities.sleep(LOGIN_DELAY_MS);

  if (!correct) {
    return unauthorized();
  }

  const token = Utilities.getUuid();
  CacheService.getScriptCache().put(sessionCacheKey(token), "valid", ADMIN_SESSION_TTL_SECONDS);
  return ok({ sessionToken: token, expiresInSeconds: ADMIN_SESSION_TTL_SECONDS }, "Authorized");
}

function handleLogoutAdmin(body) {
  const token = clean(body.adminAuthToken);
  if (token) {
    CacheService.getScriptCache().remove(sessionCacheKey(token));
  }
  return ok(null, "Logged out");
}

function handleCalculatePrice(p) {
  const selectedServices = splitCsv(p.service || p.services);
  const vehicleType = clean(p.vehicleType || p.vehicle_type);
  const dents = parseInt(clean(p.dents), 10) || 0;
  const selectedAddons = splitCsv(p.addons);

  const pricing = calculateServicePrice(selectedServices, vehicleType);

  const addonTotal = selectedAddons.reduce((sum, addonName) => {
    const addon = ADDON_CATALOG.find((a) => a.addon_name === addonName);
    return sum + (addon ? Number(addon.price) : 0);
  }, 0);

  const dentTotal = Math.round(dents * DENT_PRICE);
  const totalPrice = Math.round(pricing.serviceTotal + dentTotal + addonTotal);

  return ok({
    basePrice: Math.round(pricing.basePrice),
    multiplier: pricing.multiplier,
    serviceTotal: pricing.serviceTotal,
    dentCount: dents,
    dentPrice: DENT_PRICE,
    dentTotal: dentTotal,
    addonTotal: Math.round(addonTotal),
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
    .filter((r) => normalizeDate(r[COL_DATE]) === reqDate)
    .filter((r) => clean(r[COL_STATUS]) !== "completed")
    .map((r) => normalizeTime(r[COL_TIME]))
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

function handleGetBookings(params) {
  if (!validateSession(params && params.adminAuthToken)) {
    return unauthorized();
  }

  return withScriptLock(() => {
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

    const rows = sh.getRange(2, 1, lastRow - 1, SHEET_COLUMNS).getDisplayValues();

    // Backfill booking IDs for legacy rows so every booking has a stable lookup key.
    rows.forEach((r, i) => {
      if (r.some((cell) => clean(cell)) && !clean(r[COL_BOOKING_ID])) {
        const newId = generateBookingId();
        sh.getRange(i + 2, COL_BOOKING_ID + 1).setValue(newId);
        r[COL_BOOKING_ID] = newId;
      }
    });

    // Map before filtering so rowNumber reflects the real sheet row even when blank rows exist.
    const bookings = rows
      .map((r, i) => ({ r: r, rowNumber: i + 2 }))
      .filter((entry) => entry.r.some((cell) => clean(cell)))
      .map((entry) => {
        const r = entry.r;
        const bookingId = clean(r[COL_BOOKING_ID]);
        return {
          id: bookingId,
          bookingId: bookingId,
          rowNumber: entry.rowNumber,
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
          notes: clean(r[10]),
        };
      });

    return jsonResponse({
      success: true,
      status: "success",
      bookings: bookings,
      data: bookings,
      message: "OK",
    });
  });
}

function validateBookingFields(fields) {
  if (!fields.name || !fields.phone || !fields.service || !fields.date || !fields.time || !fields.vehicleType) {
    return "Missing required fields";
  }

  if (fields.name.length > MAX_FIELD_LENGTH) return "Name is too long";
  if (fields.phone.length > MAX_FIELD_LENGTH) return "Phone number is too long";
  if (fields.email.length > MAX_FIELD_LENGTH) return "Email is too long";
  if (fields.carModel.length > MAX_FIELD_LENGTH) return "Car model is too long";
  if (fields.notes.length > MAX_NOTES_LENGTH) return "Notes are too long";

  if (fields.email && !isValidEmail(fields.email)) return "Invalid email address";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date)) return "Invalid date";
  if (fields.date < getTodayInScriptTimeZone()) return "Date must be today or in the future";

  if (ALL_SLOTS.indexOf(fields.time) === -1) return "Invalid time slot";

  const selectedServices = splitCsv(fields.service);
  if (selectedServices.length === 0) return "Missing required fields";
  const unknownService = selectedServices.find(
    (name) => !SERVICE_CATALOG.some((s) => s.service_name === name)
  );
  if (unknownService) return "Unknown service: " + unknownService;

  if (!VEHICLE_TYPES.some((v) => v.vehicle_type === fields.vehicleType)) return "Unknown vehicle type";

  return null;
}

function handleBook(body) {
  const fields = {
    name: clean(body.customerName || body.name),
    email: clean(body.customerEmail || body.email),
    phone: clean(body.phone),
    carModel: clean(body.carModel || body.car_model),
    service: clean(body.servicePackage || body.service || body.services),
    date: normalizeDate(clean(body.date)),
    time: normalizeTime(clean(body.slot || body.timeSlot || body.time)),
    vehicleType: clean(body.vehicleType || body.vehicle_type),
    notes: clean(body.notes),
  };

  const validationError = validateBookingFields(fields);
  if (validationError) {
    return fail(validationError);
  }

  const booking = {
    name: fields.name,
    email: fields.email,
    phone: fields.phone,
    carModel: fields.carModel,
    service: fields.service,
    vehicleType: fields.vehicleType,
    notes: fields.notes,
    date: fields.date,
    time: fields.time,
    bookingId: generateBookingId(),
  };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    return fail("The booking service is busy. Please try again in a moment.");
  }

  try {
    const sh = getSheet();
    ensureHeaderRow(sh);

    const lr = sh.getLastRow();
    if (lr > 1) {
      const rows = sh.getRange(2, 1, lr - 1, SHEET_COLUMNS).getDisplayValues();
      const exists = rows.some(
        (r) =>
          normalizeDate(r[COL_DATE]) === booking.date &&
          normalizeTime(r[COL_TIME]) === booking.time &&
          clean(r[COL_STATUS]) !== "completed"
      );

      if (exists) {
        return fail("Slot already booked");
      }
    }

    // Every cell is written as plain text (apostrophe prefix) to block formula injection
    // and stop Sheets from reformatting phone numbers, dates and times.
    sh.appendRow(
      [
        booking.name,
        booking.email,
        booking.phone,
        booking.carModel,
        booking.service,
        booking.date,
        booking.time,
        "booked",
        new Date().toISOString(),
        booking.bookingId,
        booking.notes,
      ].map(sanitizeForSheet)
    );
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  // Server-side price calculation - ignore any client-submitted price
  const pricing = calculateServicePrice(splitCsv(booking.service), booking.vehicleType);
  const calculatedPrice = Math.round(pricing.serviceTotal);
  booking.price = calculatedPrice;

  const shouldSendEmail =
    String(body.sendEmail || body.notifyCustomer || body.confirmationEmail || "true").toLowerCase() !== "false";

  // The row is already saved, so nothing below may turn this into a failed booking.
  let emailSent = false;
  let emailStatus = "not_requested";

  if (shouldSendEmail && booking.email) {
    try {
      const mail = sendBookingEmail(booking.email, booking);
      emailSent = mail.sent === true;
      emailStatus = mail.reason;
    } catch (error) {
      Logger.log("Unexpected email error: " + (error && error.message ? error.message : String(error)));
      emailSent = false;
      emailStatus = "email_send_failed";
    }
  }

  // Owner notification is independent of the customer email: it is attempted for every booking.
  let ownerNotified = false;
  try {
    ownerNotified = sendOwnerNotification(booking).sent === true;
  } catch (error) {
    Logger.log("Unexpected owner notification error: " + (error && error.message ? error.message : String(error)));
  }

  return jsonResponse({
    success: true,
    status: "success",
    message: "Booking confirmed!",
    bookingId: booking.bookingId,
    data: {
      bookingId: booking.bookingId,
      service: booking.service,
      vehicleType: booking.vehicleType,
      date: booking.date,
      timeSlot: booking.time,
      price: calculatedPrice,
      status: "Confirmed",
      message: "Booking confirmed successfully!",
      emailSent: emailSent,
      emailStatus: emailStatus,
      ownerNotified: ownerNotified,
    },
  });
}

function handleDeleteBooking(body) {
  if (!validateSession(body.adminAuthToken)) {
    return unauthorized();
  }

  const bookingId = clean(body.bookingId || body.id);
  if (!bookingId) return fail("Missing booking ID");

  return withScriptLock(() => {
    const sh = getSheet();
    ensureHeaderRow(sh);

    const rowNumber = findRowByBookingId(sh, bookingId);
    if (rowNumber === -1) return fail("Booking not found");

    sh.deleteRow(rowNumber);
    return ok(null, "Booking deleted");
  });
}

// Customer self-cancellation. No admin session: the customer proves ownership with the
// booking ID from their confirmation plus the phone number used when booking.
function handleDeleteByDetails(body) {
  const phone = normalizePhone(clean(body.phone));
  const bookingId = clean(body.bookingId).toUpperCase();

  if (!phone || !bookingId) {
    return fail("Missing phone number or booking ID");
  }

  // Same message for "no such ID" and "wrong phone" so the endpoint can't be used to probe IDs.
  const notFound = "No booking found with that booking ID and phone number";

  return withScriptLock(() => {
    const sh = getSheet();
    ensureHeaderRow(sh);

    const rowNumber = findRowByBookingId(sh, bookingId);
    if (rowNumber === -1) return fail(notFound);

    const row = sh.getRange(rowNumber, 1, 1, SHEET_COLUMNS).getDisplayValues()[0];
    if (normalizePhone(row[COL_PHONE]) !== phone) return fail(notFound);

    if (clean(row[COL_STATUS]) === "completed") {
      return fail("This booking has already been completed and cannot be cancelled");
    }

    sh.deleteRow(rowNumber);
    return ok(null, "Booking cancelled");
  });
}

function handleCompleteBooking(body) {
  if (!validateSession(body.adminAuthToken)) {
    return unauthorized();
  }

  const bookingId = clean(body.bookingId || body.id);
  if (!bookingId) return fail("Missing booking ID");

  return withScriptLock(() => {
    const sh = getSheet();
    ensureHeaderRow(sh);

    const rowNumber = findRowByBookingId(sh, bookingId);
    if (rowNumber === -1) return fail("Booking not found");

    sh.getRange(rowNumber, COL_STATUS + 1).setValue("completed");
    return ok(null, "Marked completed");
  });
}
