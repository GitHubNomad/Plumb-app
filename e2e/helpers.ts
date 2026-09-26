import { expect, type Page } from "@playwright/test";
import type { ClearanceLog, SessionLog } from "../src/lib/plumb/types";

export const STORE_KEY = "plumb-coach";
export const SCREENING = "Injury, surgery, dizziness, or a clinician telling you to take it easy today?";

/** Local-date key, same shape as todayKey() in the app. */
export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function daysAgo(n: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return dayKey(d);
}

export function sessionLog(date: string, extra: Partial<SessionLog> = {}): SessionLog {
  return { id: `seed-${date}`, date, programId: "desk-reset", minutes: 5, at: 0, ...extra };
}

type Seed = {
  logs?: SessionLog[];
  checkIns?: unknown[];
  clearances?: ClearanceLog[];
  /** Persist-format version to write; 1 simulates a pre-migration install. */
  version?: number;
  /** Raw v1 field, only meaningful with version 1. */
  clearance?: string;
};

/** Writes Plumb's persisted state before any page script runs. Only on the first load. */
export async function seed(page: Page, s: Seed): Promise<void> {
  const { version = 2, ...state } = s;
  const value = JSON.stringify({
    state: { logs: [], checkIns: [], ...(version >= 2 ? { clearances: [] } : {}), ...state },
    version,
  });
  await page.addInitScript(
    ([key, v]) => {
      if (!sessionStorage.getItem("plumb-seeded")) {
        localStorage.setItem(key, v);
        sessionStorage.setItem("plumb-seeded", "1");
      }
    },
    [STORE_KEY, value] as const,
  );
}

export async function stored(page: Page): Promise<{ logs: SessionLog[]; checkIns: unknown[]; clearances: ClearanceLog[] }> {
  const raw = await page.evaluate((k) => localStorage.getItem(k), STORE_KEY);
  return JSON.parse(raw ?? "{}").state;
}

export function stepHeading(page: Page) {
  return page.locator("section h1");
}

export async function streakStat(page: Page): Promise<string> {
  await page.goto("/progress");
  const dd = page.locator("dt", { hasText: /^Streak$/ }).locator("xpath=following-sibling::dd");
  await expect(dd).toBeVisible();
  return (await dd.textContent())!.trim();
}
