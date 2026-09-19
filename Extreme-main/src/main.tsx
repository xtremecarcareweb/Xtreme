import React from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";
import "./App.css";

// Initialize Sentry for error monitoring
const sentryDSN = import.meta.env.VITE_SENTRY_DSN;
if (sentryDSN && sentryDSN !== "https://your-sentry-dsn@sentry.io/project-id") {
  Sentry.init({
    dsn: sentryDSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 1.0,
  });
} else if (import.meta.env.MODE === "production") {
  console.warn(
    "Sentry DSN not configured. Please set VITE_SENTRY_DSN in environment variables for error monitoring."
  );
}

// Create root and render with Sentry Error Boundary
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const SentryApp = Sentry.withErrorBoundary(App, {
  fallback: (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-6">
            We've been notified of the issue. Please try refreshing the page, or
            contact support if the problem persists.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Refresh Page
        </button>
      </div>
    </div>
  ),
  showDialog: true,
});

createRoot(rootElement).render(
  <React.StrictMode>
    <SentryApp />
  </React.StrictMode>
);
