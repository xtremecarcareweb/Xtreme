import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Users, Trash2, CheckCircle, LogIn, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getBookings,
  deleteBooking,
  markCompleted,
  TIME_SLOTS,
  getFriendlyError,
  type Booking,
} from "@/lib/bookings";
import { toast } from "sonner";

// Get admin token from environment
const ADMIN_AUTH_TOKEN = import.meta.env.VITE_ADMIN_AUTH_TOKEN || "";
const ADMIN_SESSION_KEY = "xtreme_admin_session";
const ADMIN_SESSION_DURATION_MS = 30 * 60 * 1000;

function hasValidAdminSession(): boolean {
  try {
    return getAdminSessionExpiry() > Date.now();
  } catch {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return false;
  }
}

function getAdminSessionExpiry(): number {
  const session = JSON.parse(sessionStorage.getItem(ADMIN_SESSION_KEY) || "null") as {
    expiresAt?: number;
  } | null;
  return session?.expiresAt || 0;
}

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(hasValidAdminSession);
  const [adminToken, setAdminToken] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const sessionTimeout = window.setTimeout(() => {
      setIsLoggedIn(false);
      setBookings([]);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      toast.info("Your admin session has expired");
    }, Math.max(0, getAdminSessionExpiry() - Date.now()));

    let isMounted = true;

    const refreshBookings = async (silent?: boolean) => {
      if (!silent) {
        setIsLoading(true);
      }

      try {
        const latest = await getBookings();
        if (!isMounted) return;
        setBookings(latest);
      } catch (error) {
        if (!isMounted) return;
        toast.error(getFriendlyError(error, "Could not load bookings"));
      } finally {
        if (!isMounted) return;
        if (!silent) {
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
      window.clearTimeout(sessionTimeout);
    };
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate token against environment variable
    if (adminToken.trim() === ADMIN_AUTH_TOKEN) {
      setIsLoggedIn(true);
      sessionStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({ expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS })
      );
      setAdminToken("");
      toast.success("Welcome, Admin!");
    } else {
      toast.error("Invalid authentication token");
      console.warn("Failed admin login attempt");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAdminToken("");
    setBookings([]);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    toast.success("Logged out successfully");
  };

  const refreshBookings = async () => {
    const latest = await getBookings();
    setBookings(latest);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBooking(id);
      await refreshBookings();
      toast.success("Booking deleted");
    } catch (error) {
      toast.error(getFriendlyError(error, "Could not delete booking"));
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await markCompleted(id);
      await refreshBookings();
      toast.success("Marked as completed");
    } catch (error) {
      toast.error(getFriendlyError(error, "Could not update booking"));
    }
  };

  const today = new Date().toISOString().split("T")[0];
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
          className="glass rounded-2xl p-6 sm:p-8 w-full max-w-sm space-y-6"
        >
          <div className="text-center">
            <LogIn className="h-10 w-10 text-primary mx-auto mb-4" />
            <h1 className="font-heading text-2xl font-bold">Admin Login</h1>
            <p className="text-muted-foreground text-sm mt-1">Xtreme Car Care Dashboard</p>
          </div>
          <div>
            <label className="text-sm font-heading font-semibold mb-2 block">Authentication Token</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="Enter admin authentication token"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Token is configured in environment variable VITE_ADMIN_AUTH_TOKEN
            </p>
          </div>
          <Button type="submit" variant="gold" className="w-full">Login</Button>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border glass">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-gradient-gold">Admin Dashboard</h1>
          <Button variant="gold-outline" size="sm" onClick={handleLogout}>Logout</Button>
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
        </div>

        {/* Bookings Table - Desktop View */}
        <div className="hidden md:block glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Name", "Email", "Phone", "Car", "Service", "Date", "Time", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      Loading bookings...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filtered.map((booking) => (
                    <tr key={booking.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
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
                        <div className="flex items-center gap-2">
                          {booking.status === "booked" && (
                            <button
                              onClick={() => handleComplete(booking.id)}
                              className="text-gradient-gold hover:text-[#bfa76a] transition-colors"
                              title="Mark completed"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                            title="Delete"
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

        {/* Bookings List - Mobile View */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading bookings...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No bookings found
            </div>
          ) : (
            filtered.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{booking.name}</h3>
                    <p className="text-xs text-muted-foreground">{booking.phone}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                    booking.status === "completed"
                      ? "bg-gradient-gold/20 text-gradient-gold"
                      : "bg-primary/20 text-primary"
                  }`}>
                    {booking.status === "completed" ? "Done" : "Booked"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-foreground truncate">{booking.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Car</p>
                    <p className="text-foreground truncate">{booking.carModel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Service</p>
                    <p className="text-foreground truncate">{booking.serviceType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="text-foreground">{booking.date} {booking.timeSlot}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                  {booking.status === "booked" && (
                    <button
                      onClick={() => handleComplete(booking.id)}
                      className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                      title="Mark completed"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark Done
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(booking.id)}
                    className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
