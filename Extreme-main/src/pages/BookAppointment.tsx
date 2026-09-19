import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Car,
  CarFront,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Droplets,
  Gauge,
  Lightbulb,
  Loader2,
  Mail,
  Minus,
  Paintbrush,
  Phone,
  Plus,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  User,
  Wind,
  Wrench,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import {
  TIME_SLOTS,
  deleteBooking,
  deleteBookingByDetails,
  getBookings,
  getFriendlyError,
} from "@/lib/bookings";
import {
  validateBookingForm,
  sanitizeName,
  validateAndSanitizeEmail,
  validateAndSanitizePhone,
  bookingLimiter,
} from "@/lib/validation";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "";
const TOTAL_STEPS = 7;

interface Service {
  service_id: string;
  service_name: string;
  base_price: number;
}

interface VehicleType {
  vehicle_type_id: string;
  vehicle_type: string;
  price_multiplier: number;
}

interface Addon {
  addon_id: string;
  addon_name: string;
  price: number;
}

interface Slot {
  time: string;
  available: boolean;
}

interface PriceSummary {
  basePrice: number;
  multiplier: number;
  serviceTotal: number;
  dentCount: number;
  dentPrice: number;
  dentTotal: number;
  addonTotal: number;
  totalPrice: number;
}

interface Confirmation {
  bookingId: string;
  service: string;
  vehicleType: string;
  date: string;
  timeSlot: string;
  price: number;
  status: string;
  message: string;
  emailSent?: boolean;
  emailStatus?: string;
}

interface Customer {
  name: string;
  phone: string;
  email: string;
  carModel: string;
  notes: string;
}

interface BookingWizardState {
  services: string[];
  vehicleType: string | null;
  dents: number;
  addons: string[];
  date: string | null;
  timeSlot: string | null;
  customer: Customer;
  calculatedPrice: number;
}

const INITIAL_STATE: BookingWizardState = {
  services: [],
  vehicleType: null,
  dents: 1,
  addons: [],
  date: null,
  timeSlot: null,
  calculatedPrice: 0,
  customer: {
    name: "",
    phone: "",
    email: "",
    carModel: "",
    notes: "",
  },
};

const STEP_TITLES = [
  "Select Vehicle",
  "Choose Service",
  "Select Date",
  "Select Time",
  "Customer Details",
  "Review",
  "Confirmation",
];

const MOCK_DATA = {
  services: [
    { service_id: "SVC010", service_name: "Business Class Customisation", base_price: 50000 },
    { service_id: "SVC011", service_name: "Full Car Customisation", base_price: 40000 },
    { service_id: "SVC001", service_name: "Paint Protection Film (PPF)", base_price: 25000 },
    { service_id: "SVC002", service_name: "Coatings", base_price: 15000 },
    { service_id: "SVC012", service_name: "Body Kits", base_price: 35000 },
    { service_id: "SVC013", service_name: "Premium Infotainment Systems", base_price: 30000 },
    { service_id: "SVC005", service_name: "Accessories", base_price: 1500 },
    { service_id: "SVC014", service_name: "Gold Package", base_price: 60000 },
    { service_id: "SVC015", service_name: "Automatic Car Wash", base_price: 2000 },
  ] as Service[],
  vehicleTypes: [
    { vehicle_type_id: "VT001", vehicle_type: "Sedan", price_multiplier: 1.0 },
    { vehicle_type_id: "VT002", vehicle_type: "SUV", price_multiplier: 1.3 },
    { vehicle_type_id: "VT003", vehicle_type: "Sports Car", price_multiplier: 1.5 },
    { vehicle_type_id: "VT004", vehicle_type: "Truck", price_multiplier: 1.4 },
  ] as VehicleType[],
  addons: [
    { addon_id: "ADD001", addon_name: "Interior Cleaning", price: 1500 },
    { addon_id: "ADD002", addon_name: "Wheel Coating", price: 2000 },
    { addon_id: "ADD003", addon_name: "Headlight Restoration", price: 1800 },
  ] as Addon[],
  bookedSlots: {} as Record<string, string[]>,
};

const ALL_SLOTS = ["09:00", "10:30", "12:00", "14:00", "16:00", "18:00"];

const serviceIcons: Record<string, typeof Shield> = {
  "Paint Protection Film": Shield,
  "Ceramic Coating": Sparkles,
  "Interior Detailing": Paintbrush,
  "Exterior Detailing": Droplets,
  "Dent Removal": Wrench,
  "Automatic Car Wash": Droplets,
};

const vehicleIcons: Record<string, typeof Car> = {
  Sedan: Car,
  SUV: CarFront,
  "Sports Car": Gauge,
  Truck: Truck,
};

const addonIcons: Record<string, typeof Wind> = {
  "Interior Cleaning": Wind,
  "Wheel Coating": Circle,
  "Headlight Restoration": Lightbulb,
};

function isDemo() {
  return !API_URL || API_URL.trim() === "";
}

async function apiCall(action: string, params: Record<string, string | number> = {}) {
  if (isDemo()) {
    return mockApiCall(action, params);
  }

  const url = new URL(API_URL);
  url.searchParams.set("action", action);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });
    return await response.json();
  } catch (err) {
    return {
      success: false,
      error: "Network error: " + (err instanceof Error ? err.message : String(err)),
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function mockApiCall(action: string, params: Record<string, string | number>) {
  return new Promise<{ success: boolean; data?: unknown; error?: string }>((resolve) => {
    setTimeout(() => {
      switch (action) {
        case "getServices":
          resolve({ success: true, data: MOCK_DATA.services });
          break;
        case "getVehicleTypes":
          resolve({ success: true, data: MOCK_DATA.vehicleTypes });
          break;
        case "getAddons":
          resolve({ success: true, data: MOCK_DATA.addons });
          break;
        case "getSlots": {
          const date = String(params.date ?? "");
          const booked = MOCK_DATA.bookedSlots[date] || [];
          resolve({
            success: true,
            data: ALL_SLOTS.map((time) => ({ time, available: !booked.includes(time) })),
          });
          break;
        }
        case "calculatePrice": {
          const selectedServices = String(params.service || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
          const vehicle = MOCK_DATA.vehicleTypes.find((v) => v.vehicle_type === params.vehicleType);
          const basePrice = selectedServices.reduce((sum, serviceName) => {
            const service = MOCK_DATA.services.find((s) => s.service_name === serviceName);
            return sum + (service ? service.base_price : 0);
          }, 0);
          const multiplier = vehicle ? vehicle.price_multiplier : 1;
          const dents = parseInt(String(params.dents || 0), 10) || 0;

          let addonTotal = 0;
          if (params.addons) {
            String(params.addons)
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
              .forEach((name) => {
                const addon = MOCK_DATA.addons.find((a) => a.addon_name === name);
                addonTotal += addon ? addon.price : 0;
              });
          }

          const serviceTotal = basePrice * multiplier;
          const dentTotal = dents * DENT_PRICE;

          resolve({
            success: true,
            data: {
              basePrice,
              multiplier,
              serviceTotal,
              dentCount: dents,
              dentPrice: DENT_PRICE,
              dentTotal,
              addonTotal,
              totalPrice: serviceTotal + dentTotal + addonTotal,
            } as PriceSummary,
          });
          break;
        }
        case "createBooking": {
          const bookingId = "BK-" + Math.floor(100000 + Math.random() * 900000);
          const date = String(params.date || "");
          const timeSlot = String(params.timeSlot || "");
          if (!MOCK_DATA.bookedSlots[date]) {
            MOCK_DATA.bookedSlots[date] = [];
          }
          MOCK_DATA.bookedSlots[date].push(timeSlot);

          resolve({
            success: true,
            data: {
              bookingId,
              service: params.service,
              vehicleType: params.vehicleType,
              date,
              timeSlot,
              price: Number(params.price || 0),
              status: "Confirmed",
              message: "Booking confirmed successfully!",
            } as Confirmation,
          });
          break;
        }
        default:
          resolve({ success: false, error: "Unknown action" });
      }
    }, 300);
  });
}

function formatDisplayDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function phonesMatch(left: string, right: string) {
  const a = normalizePhone(left);
  const b = normalizePhone(right);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.slice(-10) === b.slice(-10);
}

function normalizeDate(value: string) {
  return value.replace(/\//g, "-").trim();
}

function normalizeTime(value: string) {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

function dateMatches(a: string, b: string) {
  const left = normalizeDate(a);
  const right = normalizeDate(b);
  if (left === right) return true;

  const leftParts = left.split("-");
  const rightParts = right.split("-");
  if (leftParts.length !== 3 || rightParts.length !== 3) return false;

  const [ly, lm, ld] = leftParts;
  const [ry, rm, rd] = rightParts;
  return ly === rd && lm === rm && ld === ry;
}

function OptionCard({
  selected,
  onClick,
  title,
  subtitle,
  Icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  Icon: typeof Car;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-xl border p-4 text-left transition-all duration-200 ${
        selected
          ? "border-gradient-gold bg-gradient-gold/10 shadow-[0_0_20px_#bfa76a33]"
          : "border-border bg-secondary/70 hover:border-gradient-gold/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            selected ? "bg-primary/20" : "bg-secondary"
          }`}
        >
          <Icon className={`h-5 w-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
        </span>
        <div>
          <p className="font-heading font-semibold text-sm">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {selected && (
        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3.5 w-3.5 text-primary-foreground" />
        </span>
      )}
    </button>
  );
}

export default function BookAppointment() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<BookingWizardState>(INITIAL_STATE);
  const [services, setServices] = useState<Service[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [price, setPrice] = useState<PriceSummary | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [cancelPhone, setCancelPhone] = useState("");
  const [cancelDate, setCancelDate] = useState("");
  const [cancelTimeSlot, setCancelTimeSlot] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const progress = (step / TOTAL_STEPS) * 100;

  const getNextStep = useCallback(
    (current: number) => {
      return current + 1;
    },
    []
  );

  const getPrevStep = useCallback(
    (current: number) => {
      return current - 1;
    },
    []
  );

  const isStepValid = useCallback(
    (current: number) => {
      switch (current) {
        case 1:
          return Boolean(state.vehicleType);
        case 2:
          return state.services.length > 0;
        case 3:
          return Boolean(state.date);
        case 4:
          return Boolean(state.timeSlot);
        case 5:
          return Boolean(state.customer.name && state.customer.phone && state.customer.email);
        case 6:
          return true;
        default:
          return true;
      }
    },
    [state]
  );

  const loadStaticData = useCallback(async () => {
    const [svcRes, vehicleRes, addonRes] = await Promise.all([
      apiCall("getServices"),
      apiCall("getVehicleTypes"),
      apiCall("getAddons"),
    ]);

    const servicesData = Array.isArray(svcRes.data) && svcRes.data.length > 0
      ? (svcRes.data as Service[])
      : MOCK_DATA.services;
    const vehicleTypesData = Array.isArray(vehicleRes.data) && vehicleRes.data.length > 0
      ? (vehicleRes.data as VehicleType[])
      : MOCK_DATA.vehicleTypes;
    const addonsData = Array.isArray(addonRes.data) && addonRes.data.length > 0
      ? (addonRes.data as Addon[])
      : MOCK_DATA.addons;

    setServices(servicesData);
    setVehicleTypes(vehicleTypesData);
    setAddons(addonsData);
  }, []);

  useEffect(() => {
    void loadStaticData();
  }, [loadStaticData]);

  const loadSlots = useCallback(async () => {
    if (!state.date) return;

    setLoadingSlots(true);
    setState((prev) => ({ ...prev, timeSlot: null }));

    const result = await apiCall("getSlots", { date: state.date });
    setLoadingSlots(false);

    const availableSlots = Array.isArray(result.data) && result.data.length > 0
      ? (result.data as Slot[])
      : ALL_SLOTS.map((time) => ({ time, available: true }));

    setSlots(availableSlots);
  }, [state.date]);

  useEffect(() => {
    if (step === 4 && state.date) {
      void loadSlots();
    }
  }, [step, state.date, loadSlots]);

  const loadPrice = useCallback(async () => {
    if (state.services.length === 0 || !state.vehicleType) return;

    setLoadingPrice(true);
    const result = await apiCall("calculatePrice", {
      service: state.services.join(","),
      vehicleType: state.vehicleType,
      dents: state.dents,
      addons: state.addons.join(","),
    });
    setLoadingPrice(false);

    if (!result.success) {
      toast.error("Failed to calculate price");
      setPrice(null);
      return;
    }

    const nextPrice = (result.data as PriceSummary) || null;
    setPrice(nextPrice);
    setState((prev) => ({ ...prev, calculatedPrice: nextPrice?.totalPrice || 0 }));
  }, [state.addons, state.dents, state.services, state.vehicleType]);

  useEffect(() => {
    if (step === 6) {
      void loadPrice();
    }
  }, [step, loadPrice]);

  const goNext = async () => {
    if (!isStepValid(step)) {
      toast.error("Please complete this step before continuing.");
      return;
    }

    if (step === 6) {
      // Rate limiting: prevent spam/DoS attacks
      if (!bookingLimiter.isAllowed("booking_submission")) {
        const remainingMs = bookingLimiter.getRemainingTime("booking_submission");
        const remainingSec = Math.ceil(remainingMs / 1000);
        toast.error(`Too many booking attempts. Please wait ${remainingSec} seconds before trying again.`);
        return;
      }

      setSubmitting(true);
      setConfirmError(null);

      // Validate all form data before submission
      const validationResult = validateBookingForm(
        {
          name: state.customer.name,
          email: state.customer.email,
          phone: state.customer.phone,
          carModel: state.customer.carModel,
          service: state.services[0] || "",
          vehicleType: state.vehicleType || "",
          date: state.date || "",
          timeSlot: state.timeSlot || "",
          notes: state.customer.notes,
        },
        [
          "Business Class Customisation",
          "Full Car Customisation",
          "Paint Protection Film (PPF)",
          "Coatings",
          "Body Kits",
          "Premium Infotainment Systems",
          "Accessories",
          "Gold Package",
          "Automatic Car Wash",
        ],
        ["Sedan", "SUV", "Hatchback", "MUV", "Convertible", "Truck", "Commercial"]
      );

      if (!validationResult.isValid) {
        setSubmitting(false);
        // Show the first error message
        const firstError = Object.values(validationResult.errors)[0];
        toast.error(firstError || "Please check your form data");
        console.warn("Validation errors:", validationResult.errors);
        return;
      }

      // Use sanitized values from validation
      const payload = {
        service: state.services.join(", "),
        vehicleType: validationResult.sanitized.vehicleType || "",
        date: validationResult.sanitized.date || "",
        timeSlot: validationResult.sanitized.timeSlot || "",
        customerName: validationResult.sanitized.name,
        name: validationResult.sanitized.name,
        phone: validationResult.sanitized.phone,
        email: validationResult.sanitized.email,
        customerEmail: validationResult.sanitized.email,
        sendEmail: "true",
        notifyCustomer: "true",
        confirmationEmail: "true",
        carModel: validationResult.sanitized.carModel,
        notes: validationResult.sanitized.notes || "",
        // Note: price is NOT sent from client; server recalculates based on validated inputs
      };

      const result = await apiCall("createBooking", payload);
      setSubmitting(false);

      if (!result.success) {
        const message = String(result.error || "Something went wrong while booking.");
        setConfirmError(message);
        toast.error(message);
        setStep(7);
        return;
      }

      const confirmationData = result.data as Confirmation;
      setConfirmation(confirmationData);
      toast.success("Booking confirmed successfully");

      if (confirmationData.emailSent === false) {
        toast.warning("Booking created, but confirmation email was not sent. Please contact support.");
      }

      setStep(7);
      return;
    }

    const next = getNextStep(step);
    if (next <= TOTAL_STEPS) setStep(next);
  };

  const goBack = () => {
    const prev = getPrevStep(step);
    if (prev >= 1) setStep(prev);
  };

  const handleWizardKeyDownCapture = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (step === 2 && e.key === "Enter") {
      e.preventDefault();
    }
  };

  const resetWizard = () => {
    setState(INITIAL_STATE);
    setStep(1);
    setSlots([]);
    setPrice(null);
    setConfirmation(null);
    setConfirmError(null);
  };

  // summaryRows removed (no price display)

  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cancelPhone || !cancelDate || !cancelTimeSlot) {
      toast.error("Enter phone, date and time slot to cancel booking");
      return;
    }

    try {
      setIsCancelling(true);
      let deleted = false;

      await deleteBookingByDetails({
        phone: cancelPhone,
        date: cancelDate,
        timeSlot: cancelTimeSlot,
      });
      toast.success("Booking cancelled successfully");
      setCancelTimeSlot("");
    } catch (error) {
      toast.error(getFriendlyError(error, "Unable to cancel booking"));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <p className="text-primary font-heading text-xs tracking-[0.3em] uppercase mb-3">Appointment Wizard</p>
            <h1 className="font-heading text-3xl md:text-5xl font-bold">
              Book Your <span className="text-gradient-gold">Service</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-sm md:text-base">
              Step {step} of {TOTAL_STEPS}: {STEP_TITLES[step - 1]}
            </p>
          </motion.div>

          <div className="glass rounded-2xl p-6 md:p-8 mb-8" onKeyDownCapture={handleWizardKeyDownCapture}>
            <div className="mb-6">
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <div className="flex justify-between items-center mt-4 w-full">
                {Array.from({ length: TOTAL_STEPS }).map((_, idx) => {
                  const point = idx + 1;
                  const done = point < step;
                  const active = point === step;
                  return (
                    <div key={point} className="flex-1 flex items-center justify-center">
                      <div
                        className={`h-8 w-8 md:w-9 rounded-full text-xs flex items-center justify-center font-heading ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : done
                            ? "bg-primary/25 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {done ? <Check className="h-3.5 w-3.5" /> : point}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {step === 1 && (
                  <div>
                    <p className="font-heading font-semibold mb-4 flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" /> Select Vehicle Type
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {vehicleTypes.map((vt) => {
                        const Icon = vehicleIcons[vt.vehicle_type] || Car;
                        return (
                          <OptionCard
                            key={vt.vehicle_type_id}
                            selected={state.vehicleType === vt.vehicle_type}
                            onClick={() => setState((prev) => ({ ...prev, vehicleType: vt.vehicle_type }))}
                            title={vt.vehicle_type}
                            subtitle={`Price factor x${vt.price_multiplier}`}
                            Icon={Icon}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <p className="font-heading font-semibold mb-4 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" /> Select Service(s)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {services.map((service) => {
                        const Icon = serviceIcons[service.service_name] || Wrench;
                        const isSelected = state.services.includes(service.service_name);
                        return (
                          <OptionCard
                            key={service.service_id}
                            selected={isSelected}
                            onClick={() => {
                              setState((prev) => {
                                const hasService = prev.services.includes(service.service_name);
                                const nextServices = hasService
                                  ? prev.services.filter((value) => value !== service.service_name)
                                  : [...prev.services, service.service_name];

                                return {
                                  ...prev,
                                  services: nextServices,
                                  dents: nextServices.includes("Dent Removal") ? Math.max(1, prev.dents) : 0,
                                };
                              });
                            }}
                            title={service.service_name}
                            Icon={Icon}
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">You can select one or multiple services.</p>
                  </div>
                )}

                {/* Dent Count step removed per request */}

                {/* Add-ons step removed per request */}

                {step === 3 && (
                  <div>
                    <p className="font-heading font-semibold mb-4 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" /> Select Date
                    </p>
                    <input
                      type="date"
                      value={state.date || ""}
                      min={getTodayStr()}
                      onChange={(e) => {
                        const value = e.target.value;
                        setState((prev) => ({ ...prev, date: value || null, timeSlot: null }));
                      }}
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3"
                    />
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <p className="font-heading font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Select Time Slot
                    </p>
                    {loadingSlots ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading slots...
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {slots.map((slot) => {
                          const selected = state.timeSlot === slot.time;
                          return (
                            <button
                              type="button"
                              key={slot.time}
                              disabled={!slot.available}
                              onClick={() => setState((prev) => ({ ...prev, timeSlot: slot.time }))}
                              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : slot.available
                                  ? "border-border bg-secondary/60 hover:border-primary/40"
                                  : "border-border/40 bg-muted text-muted-foreground cursor-not-allowed"
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                        {slots.length === 0 && <p className="text-sm text-muted-foreground">No slots found for this date.</p>}
                      </div>
                    )}
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4 sm:space-y-5">
                    <p className="font-heading font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" /> Customer Details
                    </p>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Full Name</label>
                      <input
                        type="text"
                        value={state.customer.name}
                        onChange={(e) => setState((prev) => ({ ...prev, customer: { ...prev.customer, name: e.target.value } }))}
                        className="w-full rounded-lg border border-border bg-secondary px-4 py-3 min-h-[44px] text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 transition-colors"
                        placeholder="Full name"
                        autoCapitalize="words"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-primary" /> Phone Number
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={state.customer.phone}
                        onChange={(e) => setState((prev) => ({ ...prev, customer: { ...prev.customer, phone: e.target.value } }))}
                        className="w-full rounded-lg border border-border bg-secondary px-4 py-3 min-h-[44px] text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 transition-colors"
                        placeholder="Phone number"
                        pattern="[0-9+\-\s]{10,15}"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-primary" /> Email Address
                      </label>
                      <input
                        type="email"
                        inputMode="email"
                        value={state.customer.email}
                        onChange={(e) => setState((prev) => ({ ...prev, customer: { ...prev.customer, email: e.target.value } }))}
                        className="w-full rounded-lg border border-border bg-secondary px-4 py-3 min-h-[44px] text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 transition-colors"
                        placeholder="Email"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                        <Car className="h-3.5 w-3.5 text-primary" /> Car Model
                      </label>
                      <input
                        type="text"
                        value={state.customer.carModel}
                        onChange={(e) => setState((prev) => ({ ...prev, customer: { ...prev.customer, carModel: e.target.value } }))}
                        className="w-full rounded-lg border border-border bg-secondary px-4 py-3 min-h-[44px] text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 transition-colors"
                        placeholder="e.g., Hyundai Creta"
                        autoCapitalize="words"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                      <textarea
                        value={state.customer.notes}
                        onChange={(e) => setState((prev) => ({ ...prev, customer: { ...prev.customer, notes: e.target.value } }))}
                        className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 transition-colors min-h-[100px] sm:min-h-[110px] resize-none"
                        placeholder="Any special request"
                      />
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div>
                    <p className="font-heading font-semibold mb-4 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" /> Review & Confirm
                    </p>

                    {loadingPrice ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Calculating estimate...
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-border bg-secondary/60 p-4 space-y-2">
                          {summaryRows.map((row) => (
                            {/* Price summary row removed as per requirements */}
                          ))}
                        </div>

                        <div className="rounded-xl border border-border bg-secondary/60 p-4 space-y-2 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Services</span>
                            <span>{state.services.join(", ")}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Vehicle</span>
                            <span>{state.vehicleType}</span>
                          </div>
                          {/* Dents and Add-ons removed per request */}
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Date</span>
                            <span>{formatDisplayDate(state.date)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Time</span>
                            <span>{state.timeSlot}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Customer</span>
                            <span>{state.customer.name}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 7 && (
                  <div className="text-center py-6">
                    {confirmation && !confirmError ? (
                      <>
                        <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-4" />
                        <h2 className="font-heading text-3xl font-bold mb-2">Booking Confirmed</h2>
                        <p className="text-muted-foreground">{confirmation.message || "Your appointment has been scheduled."}</p>
                        {confirmation.emailSent === true && (
                          <p className="text-sm text-primary mt-2">Confirmation email has been sent to {state.customer.email}.</p>
                        )}
                        {confirmation.emailSent === false && (
                          <p className="text-sm text-destructive mt-2">
                            Booking is confirmed, but email could not be sent. Please verify your email address.
                          </p>
                        )}
                        <div className="my-6 inline-block px-5 py-2 rounded-lg border border-primary/40 bg-primary/10 font-heading font-semibold">
                          {confirmation.bookingId}
                        </div>
                        <div className="rounded-xl border border-border bg-secondary/60 p-4 text-left max-w-xl mx-auto space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>{confirmation.service}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span>{confirmation.vehicleType}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDisplayDate(confirmation.date)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{confirmation.timeSlot}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-primary">{confirmation.status}</span></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="font-heading text-3xl font-bold mb-2">Booking Failed</h2>
                        <p className="text-destructive">{confirmError || "Unable to complete booking."}</p>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between gap-3">
              {step < 9 ? (
                <>
                  <Button type="button" variant="outline" onClick={goBack} disabled={step === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button
                    type="button"
                    variant={step === 6 ? "gold" : "default"}
                    onClick={() => void goNext()}
                    disabled={!isStepValid(step) || submitting || loadingPrice}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                      </>
                    ) : step === 8 ? (
                      "Confirm Booking"
                    ) : (
                      <>
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="w-full flex justify-center">
                  <Button type="button" variant="gold" onClick={resetWizard}>
                    Book Another Service
                  </Button>
                </div>
              )}
            </div>
          </div>

          <motion.form
            onSubmit={handleCancelBooking}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="glass rounded-2xl p-6 md:p-8 space-y-5"
          >
            <div>
              <p className="text-primary font-heading text-xs tracking-[0.25em] uppercase mb-2">Manage Booking</p>
              <h2 className="font-heading text-2xl font-bold">Cancel Existing Booking</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Enter the same phone number, date, and slot used during booking.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-heading font-semibold mb-2">
                <Phone className="h-4 w-4 text-primary" /> Phone Number
              </label>
              <input
                type="tel"
                value={cancelPhone}
                onChange={(e) => setCancelPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-heading font-semibold mb-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Date
              </label>
              <input
                type="date"
                value={cancelDate}
                onChange={(e) => setCancelDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-heading font-semibold mb-2">
                <Clock className="h-4 w-4 text-primary" /> Time Slot
              </label>
              <select
                value={cancelTimeSlot}
                onChange={(e) => setCancelTimeSlot(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                required
              >
                <option value="">Select booked slot</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" variant="destructive" size="lg" className="w-full" disabled={isCancelling}>
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelling...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Booking Slot
                </>
              )}
            </Button>
          </motion.form>
        </div>
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
