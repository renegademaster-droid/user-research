/**
 * Storage and API configuration.
 * Set via env (Vite: VITE_* in .env) or override for tests.
 */

export const config = {
  /** "local" = localStorage only; "api" = backend REST API */
  storageMode: (import.meta.env?.VITE_STORAGE_MODE ?? "local") as "local" | "api",
  /** Base URL of the backend (e.g. http://localhost:4000). Used when storageMode === "api". */
  apiBaseUrl: (import.meta.env?.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, ""),
};
