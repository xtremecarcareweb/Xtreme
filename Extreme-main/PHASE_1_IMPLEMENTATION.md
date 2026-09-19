# PHASE 1 IMPLEMENTATION GUIDE
## Critical Fixes Before Production Launch

---

## 1. RATE LIMITING (Priority: CRITICAL - 4 hours)

### What to implement:
- Per-IP rate limiting in Google Apps Script
- Exponential backoff on client-side
- Rate limit headers in responses
- Graceful degradation when limit hit

### Implementation Steps:

#### Step 1: Update Code.gs with Rate Limiting

Add this at the top of `Code.gs`:

```javascript
const CACHE = CacheService.getScriptCache();
const RATE_LIMITS = {
  perMinute: 10,
  perHour: 100,
  perDay: 1000,
};

function getClientId(e) {
  // Use IP address as identifier
  return e.sourceIp || Utilities.getUuid();
}

function checkRateLimit(clientId) {
  const now = Date.now();
  const minKey = `rl_min_${clientId}`;
  const hourKey = `rl_hour_${clientId}`;
  const dayKey = `rl_day_${clientId}`;

  const minCount = parseInt(CACHE.get(minKey) || '0', 10);
  const hourCount = parseInt(CACHE.get(hourKey) || '0', 10);
  const dayCount = parseInt(CACHE.get(dayKey) || '0', 10);

  if (minCount >= RATE_LIMITS.perMinute) {
    return { allowed: false, retryAfter: 60, reason: 'per_minute' };
  }
  if (hourCount >= RATE_LIMITS.perHour) {
    return { allowed: false, retryAfter: 300, reason: 'per_hour' };
  }
  if (dayCount >= RATE_LIMITS.perDay) {
    return { allowed: false, retryAfter: 3600, reason: 'per_day' };
  }

  // Increment all counters
  CACHE.put(minKey, String(minCount + 1), 60);
  CACHE.put(hourKey, String(hourCount + 1), 3600);
  CACHE.put(dayKey, String(dayCount + 1), 86400);

  return { allowed: true };
}

function doGet(e) {
  const clientId = getClientId(e);
  const rateCheck = checkRateLimit(clientId);

  if (!rateCheck.allowed) {
    return fail(`Rate limit exceeded (${rateCheck.reason}). Try again in ${rateCheck.retryAfter}s`, {
      retryAfter: rateCheck.retryAfter,
      limit: rateCheck.reason,
    });
  }

  // ... rest of doGet logic
}

function doPost(e) {
  const clientId = getClientId(e);
  const rateCheck = checkRateLimit(clientId);

  if (!rateCheck.allowed) {
    return fail(`Rate limit exceeded. Try again in ${rateCheck.retryAfter}s`, {
      retryAfter: rateCheck.retryAfter,
    });
  }

  // ... rest of doPost logic
}
```

#### Step 2: Update Client-Side with Exponential Backoff

Create `src/lib/backoff.ts`:

```typescript
export class ExponentialBackoff {
  private baseDelay = 1000; // 1 second
  private maxDelay = 30000; // 30 seconds
  private maxRetries = 5;

  async execute<T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, delay: number) => void
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          throw error;
        }

        if (attempt < this.maxRetries - 1) {
          const delay = Math.min(
            this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
            this.maxDelay
          );

          onRetry?.(attempt + 1, delay);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }
}
```

#### Step 3: Update bookings.ts to Use Backoff

```typescript
import { ExponentialBackoff } from './backoff';

const backoff = new ExponentialBackoff();

async function postScriptPayload(payload: Record<string, unknown>): Promise<ApiResponse> {
  return backoff.execute(async () => {
    const payloadWithAuth = {
      ...payload,
      adminAuthToken: ADMIN_AUTH_TOKEN,
    };

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payloadWithAuth),
    });

    const data = await readApiResponse(response);
    
    // Handle rate limit response
    if (response.status === 429 || (data.status === 'error' && data.message?.includes('Rate limit'))) {
      throw new Error('Rate limited');
    }

    if (!response.ok || (data.status && data.status !== "success")) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  });
}
```

---

## 2. SENTRY INTEGRATION (Priority: CRITICAL - 2 hours)

### What to implement:
- Error tracking for all unhandled exceptions
- Performance monitoring
- User feedback capture
- Deployments trigger

### Implementation Steps:

#### Step 1: Install Sentry

```bash
npm install @sentry/react @sentry/tracing
```

#### Step 2: Initialize in main.tsx

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      if (error instanceof Error && error.message.includes ('Network')) {
        // Still report but with lower priority
        return event;
      }
    }
    return event;
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
);
```

#### Step 3: Add to .env.local

```
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

#### Step 4: Capture API Errors

```typescript
// In bookings.ts
async function postScriptPayload(payload: Record<string, unknown>): Promise<ApiResponse> {
  try {
    // ... existing code
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        api: 'google_apps_script',
        action: payload.action as string,
      },
      contexts: {
        payload: {
          action: payload.action,
          // Don't log sensitive data
        },
      },
    });
    throw error;
  }
}
```

---

## 3. ADMIN AUTHENTICATION (Priority: CRITICAL - 4 hours)

### Files to Create:
1. `src/pages/AdminLogin.tsx` - Login page
2. `src/hooks/useAdminAuth.ts` - Auth hook
3. `src/components/AdminGuard.tsx` - Protected route wrapper
4. Update `Code.gs` with login endpoint

### Implementation:

#### Step 1: Create AdminLogin Page

`src/pages/AdminLogin.tsx`:

```typescript
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Hash password before sending
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const response = await fetch(import.meta.env.VITE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "adminLogin",
          passwordHash: hashHex,
        }),
      });

      const result = await response.json();

      if (result.success) {
        sessionStorage.setItem("adminToken", result.data.token);
        sessionStorage.setItem("adminExpiry", String(result.data.expiry));
        toast.success("Login successful");

        const from = location.state?.from?.pathname || "/admin";
        navigate(from, { replace: true });
      } else {
        setError(result.message || "Invalid password");
        toast.error("Login failed");
      }
    } catch (err) {
      setError("Connection error. Try again.");
      toast.error("Login error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
      <Card className="w-full max-w-md p-8">
        <div className="flex justify-center mb-6">
          <Lock className="h-12 w-12 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2">Admin Portal</h1>
        <p className="text-center text-muted-foreground mb-8">
          Xtreme Car Care Booking Management
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button disabled={loading} className="w-full" type="submit">
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Questions? Contact Mohan at +91 98841 49111
        </p>
      </Card>
    </div>
  );
}
```

#### Step 2: Create Auth Hook

`src/hooks/useAdminAuth.ts`:

```typescript
import { useEffect, useState } from "react";

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    const expiry = sessionStorage.getItem("adminExpiry");

    if (token && expiry) {
      const now = Date.now();
      if (now < parseInt(expiry, 10)) {
        setIsAuthenticated(true);
      } else {
        // Token expired
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminExpiry");
      }
    }

    setLoading(false);
  }, []);

  const logout = () => {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminExpiry");
    setIsAuthenticated(false);
  };

  return { isAuthenticated, loading, logout };
}
```

#### Step 3: Create Protected Route Wrapper

`src/components/AdminGuard.tsx`:

```typescript
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, save intended location
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

#### Step 4: Add Routes in App.tsx

```typescript
import AdminLogin from "./pages/AdminLogin";
import { AdminGuard } from "@/components/AdminGuard";

// Update routes:
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/book" element={<BookAppointment />} />
  <Route path="/admin-login" element={<AdminLogin />} />
  <Route
    path="/admin"
    element={
      <AdminGuard>
        <AdminDashboard />
      </AdminGuard>
    }
  />
  <Route path="*" element={<NotFound />} />
</Routes>
```

#### Step 5: Add Login Endpoint in Code.gs

```javascript
function handleAdminLogin(body) {
  const passwordHash = clean(body.passwordHash);
  
  // Compare with stored hash (update this with your actual hash)
  const correctHash = "your_sha256_hash_of_password_here";
  
  if (passwordHash !== correctHash) {
    return fail("Invalid credentials");
  }

  // Generate session token
  const token = Utilities.getUuid();
  const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hour expiry

  // Store in Cache
  CacheService.getScriptCache().put(token, JSON.stringify({ expiry }), 86400);

  return ok({
    token: token,
    expiry: expiry,
  }, "Login successful");
}

function doPost(e) {
  // ... rate limit check first ...

  const body = JSON.parse(e.postData.contents);
  const action = clean(body.action);

  if (action === "adminLogin") return handleAdminLogin(body);
  
  // For admin operations, verify token
  if (['deleteBooking', 'deleteBookingByDetails', 'markCompleted'].includes(action)) {
    if (!verifyAdminToken(body.adminToken)) {
      return fail("Unauthorized");
    }
  }

  // ... rest of logic
}

function verifyAdminToken(token) {
  if (!token) return false;
  const cached = CacheService.getScriptCache().get(token);
  return cached !== null;
}
```

---

## 4. INPUT VALIDATION (Priority: HIGH - 4 hours)

### What to implement:
- Email validation
- Phone validation
- Service name whitelisting
- XSS prevention via escaping

### Code.gs Updates:

```javascript
function sanitizeInput(value) {
  return String(value || "")
    .trim()
    .replace(/[<>\"'`]/g, ""); // Remove potential XSS chars
}

function validateEmail(email) {
  const sanitized = sanitizeInput(email);
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(sanitized) && sanitized.length <= 100;
}

function validatePhone(phone) {
  const digits = sanitizeInput(phone).replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function validateService(serviceName) {
  const sanitized = sanitizeInput(serviceName);
  const validServices = SERVICE_CATALOG.map(s => s.service_name);
  return validServices.includes(sanitized);
}

function validateVehicleType(vehicleType) {
  const sanitized = sanitizeInput(vehicleType);
  const validTypes = VEHICLE_TYPES.map(v => v.vehicle_type);
  return validTypes.includes(sanitized);
}

function handleBook(body) {
  // ... existing validation ...

  // Add new validation
  const name = sanitizeInput(body.customerName || body.name);
  if (!name || name.length < 2 || name.length > 100) {
    return fail("Invalid name (2-100 characters required)");
  }

  const email = sanitizeInput(body.customerEmail || body.email);
  if (!validateEmail(email)) {
    return fail("Invalid email format");
  }

  const phone = sanitizeInput(body.phone);
  if (!validatePhone(phone)) {
    return fail("Invalid phone number");
  }

  const service = sanitizeInput(body.service);
  if (!validateService(service)) {
    return fail("Invalid service selected");
  }

  const vehicleType = sanitizeInput(body.vehicleType);
  if (!validateVehicleType(vehicleType)) {
    return fail("Invalid vehicle type");
  }

  // ... rest of booking logic
}
```

---

## 5. SECURITY HEADERS (Priority: HIGH - 1 hour)

### Update vercel.json:

```json
{
  "headers": [
    {
      "source": "/",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.sentry.io *.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' *.sentry.io script.google.com; frame-ancestors 'none';"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/admin",
      "destination": "/admin-login",
      "statusCode": 307
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Implementation Timeline

**Week 1 (40 hours):**

| Day | Task | Hours | Owner |
|-----|------|-------|-------|
| Day 1-2 | Rate limiting (GAS + client) | 6 | Backend |
| Day 2 | Sentry integration | 4 | Full-stack |
| Day 2-3 | Admin authentication | 8 | Full-stack |
| Day 3 | Input validation | 6 | Backend |
| Day 3-4 | Security headers + testing | 4 | DevOps |
| Day 4 | Load testing + fixes | 6 | QA |
| Day 5 | Documentation + deployment | 4 | Full-stack |
| **Total** | | **38** | |

---

## Testing Checklist

Before deploying Phase 1:

- [ ] Rate limiting blocks 11th request within 60s
- [ ] Exponential backoff retries failed requests
- [ ] Sentry captures errors in production-like environment
- [ ] Admin login blocks unauthorized access
- [ ] Admin token expires after 24 hours
- [ ] XSS payload in name field is sanitized
- [ ] SQL-like injection in phone field is handled  
- [ ] Invalid email rejected server-side
- [ ] Security headers present in response
- [ ] HSTS enforces HTTPS
- [ ] CSP blocks external inline scripts

---

## Deployment Steps

```bash
# 1. Commit all changes
git add -A
git commit -m "Phase 1: Critical security and reliability fixes"

# 2. Push to staging branch
git push origin phase1-staging

# 3. Test on staging Vercel preview
# Review Sentry dashboard
# Load test with 50 concurrent users
# Admin login works correctly

# 4. Deploy to production
git push origin main

# 5. Monitor Sentry for 24 hours
# Check error rates drop
# Verify no booking failures
```

---

## Post-Deployment Validation

- [ ] Zero booking failures in Sentry (24 hour check)
- [ ] No rate limit false positives
- [ ] Admin portal accessible and secure
- [ ] Emails delivering correctly
- [ ] Performance metrics in Google Analytics stable
- [ ] No CORS errors reported

---

**Next Steps:** After Phase 1 deployment validation, proceed to Phase 2 (Concurrency Control, Caching, SMS)
