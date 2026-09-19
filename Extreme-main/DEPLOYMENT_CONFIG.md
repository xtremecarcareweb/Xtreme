# PRODUCTION DEPLOYMENT CONFIGURATION

## Environment Variables Setup

### .env.local (Development)
```bash
# API Configuration
VITE_API_URL=https://your-deployed-apps-script-url/exec
VITE_ADMIN_AUTH_TOKEN=dev_token_change_in_production

# Error Monitoring
VITE_SENTRY_DSN=https://your-sentry-key@sentry.io/123456
VITE_ENVIRONMENT=development

# Analytics (Optional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Vercel Environment Variables
Set these in Vercel Dashboard → Project Settings → Environment Variables:

```
Production:
  VITE_API_URL=https://your-production-apps-script-url/exec
  VITE_ADMIN_AUTH_TOKEN=<use-strong-random-token>
  VITE_SENTRY_DSN=https://your-sentry-production-key@sentry.io/123456
  VITE_ENVIRONMENT=production
  VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

Preview/Staging:
  VITE_API_URL=https://your-staging-apps-script-url/exec
  VITE_ADMIN_AUTH_TOKEN=<staging-token>
  VITE_SENTRY_DSN=https://your-sentry-staging-key@sentry.io/654321
  VITE_ENVIRONMENT=staging
  VITE_GA_MEASUREMENT_ID=G-YYYYYYYYYY
```

---

## Google Apps Script Deployment Checklist

### Before Deploying GAS:

1. **Update Security Constants** in Code.gs:
   ```javascript
   // Production password hash (SHA-256 of your admin password)
   const ADMIN_PASSWORD_HASH = "your_sha256_hash_here";
   
   // Rate limiting (adjust based on expected traffic)
   const RATE_LIMITS = {
     perMinute: 10,    // 10 requests per minute per IP
     perHour: 100,     // 100 requests per hour per IP
     perDay: 1000,     // 1000 requests per day per IP
   };
   
   // Gmail sender
   const SENDER_EMAIL = "noreply@xtremecarcare.in"; // if using domain
   ```

2. **Enable Logging:**
   ```javascript
   // At top of Code.gs
   const DEBUG_MODE = false; // Set to false in production
   
   function log(message) {
     if (DEBUG_MODE) {
       Logger.log(message);
     }
   }
   ```

3. **Deploy as New Version:**
   - In Apps Script editor: Deploy → New deployment
   - Type: Web app
   - Execute as: Your Google account
   - Who has access: Anyone
   - Copy the deployment URL

4. **Test Deployment:**
   ```bash
   # Test basic endpoint
   curl "https://your-deployment-url/exec?action=getServices"
   
   # Expected response: JSON with services
   ```

### After Deploying GAS:

1. Update `VITE_API_URL` in Vercel with new deployment URL
2. Test all endpoints:
   - getServices ✓
   - getVehicleTypes ✓
   - getSlots ✓
   - createBooking ✓
   - adminLogin ✓
   - Rate limiting ✓

---

## Sentry Setup Guide

### 1. Create Sentry Project
- Go to sentry.io
- Create new organization: "Xtreme Car Care"
- Create project: "Frontend"
- Platform: React
- Copy DSN

### 2. Configure Error Alerts
- Settings → Alerts → Create Alert Rule
- Alert rule: `error rate >= 5% in 5 minutes`
- Trigger: Email to dev@example.com + Slack webhook

### 3. Configure Performance Monitoring
- Performance → Transactions
- Set up alerts for:
  - Transaction duration > 3 seconds (50th percentile)
  - Error rate > 10%

### 4. Deployment Tracking
- Release → Create Release
- Version format: `xtremecarcare@1.0.0-production`
- Source maps: Upload after build

---

## Vercel Configuration

### vercel.json (Production)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@vite_api_url",
    "VITE_ADMIN_AUTH_TOKEN": "@vite_admin_auth_token",
    "VITE_SENTRY_DSN": "@vite_sentry_dsn",
    "VITE_ENVIRONMENT": "production"
  },
  "headers": [
    {
      "source": "/",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        },
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
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' *.sentry.io *.google.com www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: www.google-analytics.com; font-src 'self' data:; connect-src 'self' *.sentry.io script.google.com www.google-analytics.com; frame-ancestors 'none'; upgrade-insecure-requests;"
        }
      ]
    },
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/admin",
      "destination": "/admin-login",
      "permanent": true
    },
    {
      "source": "/sitemap.xml",
      "destination": "/sitemap.xml",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "regions": ["iad1", "sin1"],
  "functions": {
    "src/api/**": {
      "memory": 3008,
      "maxDuration": 60
    }
  }
}
```

---

## DNS & Domain Configuration

### For xtremecarcare.in:

1. **DNS Records** (Update in your domain registrar):
   ```
   Type    Name                Value
   CNAME   www                 cname.vercel.com
   CNAME   @                   cname.vercel.com
   TXT     _vercel             (Vercel verification token)
   ```

2. **Email Records** (for noreply@ email):
   ```
   Type    Name           Value
   MX      @              10 mail.google.com
   SPF     @              v=spf1 include:_spf.google.com ~all
   DKIM    google._domainkey  (Google Workspace DKIM)
   ```

3. **Google Analytics 4**:
   Add to index.html:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

---

## Monitoring & Alerting Setup

### Sentry Alerts

#### Alert 1: High Error Rate
```
When: Error rate (5 min) >= 10%
Then: Send to #alerts on Slack
```

#### Alert 2: Booking Failures
```
When: Event has tag environment:production AND message contains "createBooking"
Then: Send to #alerts on Slack
```

#### Alert 3: Rate Limit Triggered
```
When: Event has tag error-type:rate_limit AND count >= 5 in 5 min
Then: Send to #alerts on Slack + Email
```

### Google Analytics Events to Track

```javascript
// In BookAppointment.tsx
gtag('event', 'booking_step_viewed', {
  step_number: step,
  step_name: STEP_TITLES[step - 1],
});

gtag('event', 'booking_service_selected', {
  service_name: selectedService,
});

gtag('event', 'booking_completed', {
  booking_id: confirmationData.bookingId,
  total_value: price,
  vehicle_type: state.vehicleType,
});

gtag('event', 'booking_failed', {
  error_message: error.message,
});
```

---

## Load Testing Configuration

### For Local Testing:

```bash
# Install k6 load testing tool
npm install -g k6

# Create load test script: k6-test.js
```

**k6-test.js:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};

export default function() {
  let res = http.get('https://xtremecarcare.in');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  sleep(1);
}
```

Run: `k6 run k6-test.js`

---

## Backup & Disaster Recovery

### Daily Google Sheets Backup

Add a trigger to Code.gs:

```javascript
function setupDailyBackup() {
  // Runs daily at 2 AM
  ScriptApp.newTrigger('backupBookingsSheet')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();
}

function backupBookingsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  // Create a copy
  const backup = ss.insertSheet(
    `${SHEET_NAME}_backup_${Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd')}`,
    ss.getSheets().length
  );
  
  sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn())
    .copyTo(backup.getRange(1, 1), SpreadsheetApp.CopyPasteType.PASTE_VALUES);
  
  Logger.log('Backup created successfully');
}
```

---

## Incident Response Plan

### Booking API Outage (15-min fix target)

**Detection:** 
- Sentry error rate > 10% for 5 minutes
- Alert triggered to #alerts Slack channel

**1. Diagnosis (0-3 min):**
- Check GAS execution quota: https://script.google.com/home/executions
- Check Google Cloud status: status.cloud.google.com
- Check Vercel deployment: https://vercel.com/dashboard

**2. Mitigation (3-10 min):**
- If GAS quota exceeded: Temporarily deploy error message "Try again tomorrow"
- If network timeout: Check GAS logs for slow queries
- If Google Cloud issue: Redirect to fallback (Instagram story "message us")

**3. Recovery (10-15 min):**
- Scale back to normal once quota resets
- Send SMS to affected customers if bookings failed
- Post incident analysis in Slack

---

## Security Checklist (Pre-Launch)

- [ ] All passwords/tokens stored in Vercel env vars only
- [ ] Admin auth_token changed from default
- [ ] CORS headers configured in GAS
- [ ] Rate limiting deployed and tested
- [ ] Input validation on all fields
- [ ] Sentry DSN configured and tested
- [ ] HTTPS redirect enforced
- [ ] Security headers present in responses
- [ ] CSP policy configured restrictively
- [ ] Google Apps Script script deployed as new version
- [ ] Domain DNS configured correctly
- [ ] SSL certificate auto-renewed (Vercel handles)
- [ ] Admin login page accessible only via HTTPS
- [ ] Session tokens expire after 24 hours
- [ ] No secrets in git history (use git-secrets tool)

**Run check:** `git log --all -p | grep -i "password\|token\|secret\|key" | head -20`

---

## Post-Launch Monitoring (First Week)

### Daily Checklist:
- [ ] Sentry error rate < 5%
- [ ] Average response time < 1s
- [ ] Zero booking data loss
- [ ] Admin login working
- [ ] Emails delivering > 95%
- [ ] No rate limit false positives
- [ ] Zero security alerts
- [ ] Database (Google Sheets) not locked

### Weekly Checklist:
- [ ] Review Sentry errors + fix top 3
- [ ] Check Core Web Vitals (Google PageSpeed)
- [ ] Analyze conversion funnel (Google Analytics)
- [ ] Customer support tickets reviewed
- [ ] Backup integrity verified
- [ ] Security logs audited

---

## Production Runbook

### Accessing Admin Dashboard:
1. Go to https://xtremecarcare.in/admin-login
2. Enter admin password (stored in secure password manager)
3. View/manage bookings in dashboard
4. Logout after done

### Emergency Contacts:
- Primary: Mohan (+91 98841 49111)
- Dev team: dev@xtremecarcare.in
- Sentry alerts: Go to Slack #alerts
- Vercel status: vercel.com/status

### Critical Procedures:

**Delete Duplicate Booking:**
1. Find in admin dashboard
2. Click delete button
3. Confirm deletion
4. Send SMS to customer: "Duplicate booking cancelled"

**Server Issues Troubleshooting:**
1. Check Sentry (sentry.io)
2. Check GAS logs (script.google.com/home/executions)
3. Check Vercel logs (vercel.com/dashboard)
4. Restart doesn't exist (serverless) → Only logs matter

---

## Cost Optimization

### Current Monthly Costs:
- Vercel: $20 (Pro plan for analytics)
- Sentry: $29 (error tracking)
- SMS (Twilio): ~$30 (100 bookings)
- Email (Gmail): $0 (built-in)
- Google Apps Script: $0 (included)
- Custom domain: $12 (annual)
- **Total: ~$80-100/month**

### Cost Reduction Tips:
- Use Vercel Hobby ($0) if traffic < 1000 visitors/month
- Use Sentry free tier if error volume < 5000/month
- Use AWS SNS for SMS instead of Twilio (cheaper)
- Migrate to Firestore when >10k bookings (more scalable)

---

**Configuration complete. Ready for production deployment.**
