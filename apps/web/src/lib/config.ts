// ─────────────────────────────────────────────────────────────────────────────
//  Frontend Environment Configuration
//  All env vars must be prefixed with VITE_ to be exposed to the browser.
//  Never put secrets in VITE_ variables — they are visible in the browser.
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1',
  appName: 'BIS Intelligent Platform',
  environment: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;
