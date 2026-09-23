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

const ADMIN_USER = "admin";
const ADMIN_PASS = "xtreme2024";
const ADMIN_SESSION_KEY = "xtreme-admin-session";
const ADMIN_SESSION_TTL_MS = 30 * 60 * 1000;

function createSessionToken(): string {
  return `${crypto.randomUUID()}.${Date.now()}`;
}

function hasValidAdminSession(): boolean {
  try {
    const rawSession = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!rawSession) return false;

    const session = JSON.parse(rawSession) as { token?: string; expiresAt?: number };
    if (!session.token || !session.expiresAt || session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return false;
    }

    return true;
  } catch {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return false;
  }
}

function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasValidAdminSession());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    let isMounted = true;

    const refreshBookings = async (silent?: boolean) => {
      if (!silent) {
        setIsLoading(true);
      }

      try {
        const latest = await getBookings();
        if (isMounted) {
          setBookings(latest);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(getFriendlyError(error, "Could not load bookings"));
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
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({ token: createSessionToken(), expiresAt: Date.now() + ADMIN_SESSION_TTL_MS })
      );
      setIsLoggedIn(true);
      setUsername("");
      setPassword("");
      toast.success("Welcome, Admin!");
    } else {
      toast.error("Invalid credentials");
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setIsLoggedIn(false);
    setBookings([]);
    setFilterDate("");
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
          className="glass rounded-2xl p-8 w-full max-w-sm space-y-6"
        >
          <div className="text-center">
            <LogIn className="h-10 w-10 text-primary mx-auto mb-4" />
            <h1 className="font-heading text-2xl font-bold">Admin Login</h1>
            <p className="text-muted-foreground text-sm mt-1">Xtreme Car Care Dashboard</p>
          </div>
          <div>
            <label className="text-sm font-heading font-semibold mb-2 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-sm font-heading font-semibold mb-2 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
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

        {/* Bookings Table */}
        <div className="glass rounded-xl overflow-hidden">
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
      </div>
    </div>
  );
}
