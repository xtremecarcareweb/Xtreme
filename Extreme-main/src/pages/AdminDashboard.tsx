import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Users, Trash2, CheckCircle, LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getBookings,
  deleteBooking,
  markCompleted,
  loginAdmin,
  logoutAdmin,
  UnauthorizedError,
  TIME_SLOTS,
  getFriendlyError,
  type Booking,
} from "@/lib/bookings";
import { toast } from "sonner";

// The admin types a username and password, the backend verifies both and returns a session token
// (valid up to 6 hours server-side). Only that token is stored, for this tab only.
const SESSION_TOKEN_KEY = "xtreme-session-token";

function readSessionToken(): string | null {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

function saveSessionToken(token: string): void {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {
    // Storage unavailable (e.g. private mode): the session just won't survive a reload.
  }
}

function clearSessionToken(): void {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export default function AdminDashboard() {
  const [sessionToken, setSessionToken] = useState<string | null>(() => readSessionToken());
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Booking | null>(null);
  // Bumped on every admin action so a refresh that started before the action cannot overwrite
  // the optimistic update with stale rows when it resolves.
  const mutationVersion = useRef(0);

  const isLoggedIn = Boolean(sessionToken);

  // Resets to the login screen without contacting the server.
  const resetToLogin = useCallback(() => {
    clearSessionToken();
    setSessionToken(null);
    setBookings([]);
    setFilterDate("");
    setSyncError(null);
  }, []);

  const handleLogout = async () => {
    const token = sessionToken;
    resetToLogin();
    if (token) {
      await logoutAdmin(token);
    }
  };

  const handleSessionRejected = useCallback(() => {
    resetToLogin();
    toast.error("Your session has expired. Please log in again.");
  }, [resetToLogin]);

  useEffect(() => {
    if (!sessionToken) return;

    let isMounted = true;

    const refreshBookings = async (silent?: boolean) => {
      if (!silent) {
        setIsLoading(true);
      }

      const versionAtStart = mutationVersion.current;
      try {
        const latest = await getBookings(sessionToken);
        if (isMounted && versionAtStart === mutationVersion.current) {
          setBookings(latest);
          setSyncError(null);
        }
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          if (isMounted) handleSessionRejected();
          return;
        }
        // Background refreshes never toast; the status line above the table shows the problem.
        if (isMounted) {
          setSyncError(getFriendlyError(error, "Could not load bookings"));
        }
        if (import.meta.env.DEV) {
          console.warn("[Admin] Booking refresh failed:", error);
        }
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    void refreshBookings();

    const pollId = window.setInterval(() => {
      void refreshBookings(true);
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(pollId);
    };
  }, [sessionToken, handleSessionRejected]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput || isVerifying) return;

    setIsVerifying(true);
    try {
      const token = await loginAdmin(usernameInput.trim(), passwordInput);
      if (!token) {
        toast.error("Invalid username or password");
        return;
      }
      saveSessionToken(token);
      setSessionToken(token);
      setUsernameInput("");
      setPasswordInput("");
      toast.success("Welcome, Admin!");
    } catch {
      toast.error("Could not reach the booking service. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const refreshAfterAction = async () => {
    if (!sessionToken) return;
    const versionAtStart = mutationVersion.current;
    try {
      const latest = await getBookings(sessionToken);
      if (versionAtStart === mutationVersion.current) {
        setBookings(latest);
      }
      setSyncError(null);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        handleSessionRejected();
        return;
      }
      setSyncError(getFriendlyError(error, "Could not load bookings"));
    }
  };

  // Applies an admin action optimistically: the table changes at once, the backend call runs
  // afterwards, and the row is put back if the call fails.
  const runOptimisticAction = async (
    bookingId: string,
    applyLocally: (current: Booking[]) => Booking[],
    callBackend: (token: string) => Promise<void>,
    successMessage: string,
    fallbackError: string
  ) => {
    if (!sessionToken) return;
    const original = bookings.find((b) => b.bookingId === bookingId);
    mutationVersion.current += 1;
    setBookings(applyLocally);
    try {
      await callBackend(sessionToken);
    } catch (error) {
      if (original) {
        mutationVersion.current += 1;
        // Restore only this row so other actions made in the meantime are kept.
        setBookings((current) =>
          current.some((b) => b.bookingId === bookingId)
            ? current.map((b) => (b.bookingId === bookingId ? original : b))
            : [...current, original]
        );
      }
      if (error instanceof UnauthorizedError) {
        handleSessionRejected();
        return;
      }
      toast.error(getFriendlyError(error, fallbackError));
      return;
    }
    toast.success(successMessage);
    await refreshAfterAction();
  };

  const handleDelete = (bookingId: string) =>
    runOptimisticAction(
      bookingId,
      (current) => current.filter((b) => b.bookingId !== bookingId),
      (token) => deleteBooking(bookingId, token),
      "Booking deleted",
      "Could not delete booking"
    );

  const handleComplete = (bookingId: string) =>
    runOptimisticAction(
      bookingId,
      (current) => current.map((b) => (b.bookingId === bookingId ? { ...b, status: "completed" as const } : b)),
      (token) => markCompleted(bookingId, token),
      "Marked as completed",
      "Could not update booking"
    );

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const bookingId = pendingDelete.bookingId;
    setPendingDelete(null);
    void handleDelete(bookingId);
  };

  // YYYY-MM-DD for the current day in India, regardless of the admin's device timezone.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const todayBookings = bookings.filter((b) => b.date === today);
  const filtered = filterDate ? bookings.filter((b) => b.date === filterDate) : bookings;
  const availableToday = TIME_SLOTS.length - todayBookings.filter((b) => b.status === "booked").length;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-8 w-full max-w-sm space-y-6"
        >
          <div className="text-center">
            <LogIn className="h-10 w-10 text-primary mx-auto mb-4" />
            <h1 className="font-heading text-2xl font-bold">Admin Login</h1>
            <p className="text-muted-foreground text-sm mt-1">Xtreme Car Care Dashboard</p>
          </div>
          <div>
            <label htmlFor="admin-username" className="text-sm font-heading font-semibold mb-2 block">Username</label>
            <input
              id="admin-username"
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="text-sm font-heading font-semibold mb-2 block">Password</label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" variant="gold" className="w-full h-11" disabled={isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border glass">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-gradient-gold">Admin Dashboard</h1>
          <Button variant="gold-outline" size="sm" onClick={() => void handleLogout()}>Logout</Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Bookings", value: bookings.length, color: "text-primary" },
            { icon: CalendarDays, label: "Today's Appointments", value: todayBookings.length, color: "text-primary" },
            { icon: Clock, label: "Available Slots Today", value: availableToday, color: "text-primary" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6"
            >
              <stat.icon className={`h-8 w-8 ${stat.color} mb-3`} />
              <p className="font-heading text-3xl font-bold">{stat.value}</p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm font-heading font-semibold">Filter by date:</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-4 py-2 text-foreground text-sm focus:border-primary focus:outline-none transition-colors"
          />
          {filterDate && (
            <Button variant="ghost" size="sm" onClick={() => setFilterDate("")}>Clear</Button>
          )}
          {syncError && (
            <p className="ml-auto text-xs text-destructive" role="status" title={syncError}>
              Live refresh failed — retrying…
            </p>
          )}
        </div>

        {/* Bookings Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Booking ID", "Name", "Email", "Phone", "Car", "Service", "Date", "Time", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-muted-foreground">
                      Loading bookings...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-muted-foreground">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filtered.map((booking) => (
                    <tr key={booking.bookingId} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono whitespace-nowrap">{booking.bookingId || "-"}</td>
                      <td className="px-4 py-3 text-sm font-medium">{booking.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{booking.email || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{booking.phone}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{booking.carModel}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{booking.serviceType}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{booking.date}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{booking.timeSlot}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          booking.status === "completed"
                            ? "bg-gradient-gold/20 text-gradient-gold"
                            : "bg-primary/20 text-primary"
                        }`}>
                          {booking.status === "completed" ? "Completed" : "Booked"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {booking.status === "booked" && (
                            <button
                              onClick={() => void handleComplete(booking.bookingId)}
                              className="inline-flex h-11 w-11 items-center justify-center text-gradient-gold hover:text-[#bfa76a] transition-colors"
                              title="Mark completed"
                              aria-label="Mark completed"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setPendingDelete(booking)}
                            className="inline-flex h-11 w-11 items-center justify-center text-destructive hover:text-destructive/80 transition-colors"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(isOpen) => !isOpen && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingDelete && (
            <p className="text-sm">
              <span className="font-mono">{pendingDelete.bookingId}</span> · {pendingDelete.name} · {pendingDelete.date}{" "}
              {pendingDelete.timeSlot}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
