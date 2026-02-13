import { config } from "./config";
import type { StoredStudy } from "./types";

const STUDIES_KEY = "user-research-studies";
const CURRENT_STUDY_ID_KEY = "user-research-current-study-id";

function safeParse<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

// --- Local storage implementation (sync for current id; async wrappers for studies) ---

function localLoadStudies(): StoredStudy[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STUDIES_KEY);
  if (!raw) return [];
  const parsed = safeParse<StoredStudy[]>(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function localSaveStudy(study: StoredStudy): void {
  if (typeof window === "undefined") return;
  const studies = localLoadStudies();
  const index = studies.findIndex((s) => s.id === study.id);
  const updated = { ...study, updatedAt: Date.now() };
  const next =
    index >= 0
      ? studies.map((s) => (s.id === study.id ? updated : s))
      : [...studies, updated];
  localStorage.setItem(STUDIES_KEY, JSON.stringify(next));
}

function localLoadStudy(id: string): StoredStudy | null {
  return localLoadStudies().find((s) => s.id === id) ?? null;
}

function localDeleteStudy(id: string): void {
  if (typeof window === "undefined") return;
  const studies = localLoadStudies().filter((s) => s.id !== id);
  localStorage.setItem(STUDIES_KEY, JSON.stringify(studies));
}

// --- API implementation ---

async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("NOT_FOUND");
    throw new Error(`API error: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function apiLoadStudies(): Promise<StoredStudy[]> {
  return apiRequest<StoredStudy[]>("/api/studies");
}

async function apiLoadStudy(id: string): Promise<StoredStudy | null> {
  try {
    return await apiRequest<StoredStudy>(`/api/studies/${id}`);
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") return null;
    throw e;
  }
}

async function apiSaveStudy(study: StoredStudy): Promise<void> {
  await apiRequest(`/api/studies/${study.id}`, {
    method: "PUT",
    body: JSON.stringify({ ...study, updatedAt: Date.now() }),
  });
}

async function apiDeleteStudy(id: string): Promise<void> {
  await apiRequest(`/api/studies/${id}`, { method: "DELETE" });
}

// --- Public API (current study id is always local; studies use config) ---

/**
 * Load all stored studies (async; uses local or API based on config).
 */
export async function loadStudies(): Promise<StoredStudy[]> {
  if (config.storageMode === "api") return apiLoadStudies();
  return Promise.resolve(localLoadStudies());
}

/**
 * Load a single study by id (async).
 */
export async function loadStudy(id: string): Promise<StoredStudy | null> {
  if (config.storageMode === "api") return apiLoadStudy(id);
  return Promise.resolve(localLoadStudy(id));
}

/**
 * Save or update a study (async).
 */
export async function saveStudy(study: StoredStudy): Promise<void> {
  const payload = { ...study, updatedAt: Date.now() };
  if (config.storageMode === "api") return apiSaveStudy(payload);
  localSaveStudy(payload);
  return Promise.resolve();
}

/**
 * Delete a study by id (async).
 */
export async function deleteStudy(id: string): Promise<void> {
  if (config.storageMode === "api") return apiDeleteStudy(id);
  localDeleteStudy(id);
  return Promise.resolve();
}

/**
 * Get the id of the study currently being edited (local only; sync).
 */
export function getCurrentStudyId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_STUDY_ID_KEY);
}

/**
 * Set the current study id (local only; sync).
 */
export function setCurrentStudyId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id == null) localStorage.removeItem(CURRENT_STUDY_ID_KEY);
  else localStorage.setItem(CURRENT_STUDY_ID_KEY, id);
}
