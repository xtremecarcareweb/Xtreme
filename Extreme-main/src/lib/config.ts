function requireEnv(name: "VITE_API_URL", value: string | undefined): string {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    throw new Error(
      `[Config] ${name} is not set. Add it to your .env file (see .env.example) or to your hosting provider's environment variables, then rebuild.`
    );
  }
  return trimmed;
}

// Single backend endpoint (Google Apps Script web app) used for every request.
export const API_URL = requireEnv("VITE_API_URL", import.meta.env.VITE_API_URL);
