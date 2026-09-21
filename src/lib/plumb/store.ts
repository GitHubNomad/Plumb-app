import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey } from "@/lib/utils";
import { programById, rotationIdForDate } from "./catalog";
import type {
  BackupV2,
  CheckIn,
  Clearance,
  ClearanceLog,
  Focus,
  LineFeel,
  SessionLog,
} from "./types";

type PersistedV1 = {
  logs?: SessionLog[];
  checkIns?: CheckIn[];
  clearance?: Clearance | null;
};

type PlumbState = {
  logs: SessionLog[];
  checkIns: CheckIn[];
  clearances: ClearanceLog[];
  completeSession: (entry: Omit<SessionLog, "id" | "date" | "at">) => void;
  saveCheckIn: (line: LineFeel, hotspot: Focus | "none") => void;
  setClearance: (clearance: Clearance) => void;
  replaceFromBackup: (data: unknown) => boolean;
};

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueDates(logs: SessionLog[]): string[] {
  return [...new Set(logs.map((l) => l.date))].sort();
}

/** A tap-through of only skips does not count as a held day. */
export function sessionHeld(log: SessionLog): boolean {
  if (log.stepCount == null) return true;
  return (log.skippedStepIds?.length ?? 0) < log.stepCount;
}

export function heldLogs(logs: SessionLog[]): SessionLog[] {
  return logs.filter(sessionHeld);
}

export function computeStreak(logs: SessionLog[], today = todayKey()): number {
  const set = new Set(heldLogs(logs).map((l) => l.date));
  let streak = 0;
  const cursor = new Date(`${today}T12:00:00`);
  if (!set.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (set.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeLongest(logs: SessionLog[]): number {
  const days = uniqueDates(heldLogs(logs));
  if (!days.length) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(`${days[i - 1]}T12:00:00`);
    const cur = new Date(`${days[i]}T12:00:00`);
    const diff = (cur.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

export const usePlumb = create<PlumbState>()(
  persist(
    (set, get) => ({
      logs: [],
      checkIns: [],
      clearances: [],
      completeSession: (entry) => {
        const date = todayKey();
        set({
          logs: [
            ...get().logs,
            { id: uid(), date, at: Date.now(), ...entry },
          ],
        });
      },
      saveCheckIn: (line, hotspot) => {
        const date = todayKey();
        const rest = get().checkIns.filter((c) => c.date !== date);
        set({ checkIns: [...rest, { date, line, hotspot }] });
      },
      setClearance: (clearance) => {
        const date = todayKey();
        const rest = get().clearances.filter((c) => c.date !== date);
        set({ clearances: [...rest, { date, clearance }] });
      },
      replaceFromBackup: (data) => {
        const parsed = parseBackup(data);
        if (!parsed) return false;
        set({
          logs: parsed.logs,
          checkIns: parsed.checkIns,
          clearances: parsed.clearances,
        });
        return true;
      },
    }),
    {
      name: "plumb-coach",
      skipHydration: true,
      version: 2,
      migrate: (persisted, version) => {
        const raw = (persisted ?? {}) as PersistedV1 & { clearances?: ClearanceLog[] };
        if (version < 2) {
          return {
            logs: Array.isArray(raw.logs) ? raw.logs : [],
            checkIns: Array.isArray(raw.checkIns) ? raw.checkIns : [],
            clearances: [],
          };
        }
        return {
          logs: Array.isArray(raw.logs) ? raw.logs : [],
          checkIns: Array.isArray(raw.checkIns) ? raw.checkIns : [],
          clearances: Array.isArray(raw.clearances) ? raw.clearances : [],
        };
      },
    },
  ),
);

export function buildBackup(): BackupV2 {
  const { logs, checkIns, clearances } = usePlumb.getState();
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    logs,
    checkIns,
    clearances,
  };
}

export function parseBackup(data: unknown): BackupV2 | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as { version?: number };
  if (raw.version === 1) {
    const v1 = data as {
      exportedAt?: string;
      logs?: unknown;
      checkIns?: unknown;
    };
    if (!Array.isArray(v1.logs) || !Array.isArray(v1.checkIns)) return null;
    return {
      version: 2,
      exportedAt: typeof v1.exportedAt === "string" ? v1.exportedAt : new Date().toISOString(),
      logs: v1.logs.filter(isSessionLog),
      checkIns: v1.checkIns.filter(isCheckIn),
      clearances: [],
    };
  }
  if (raw.version === 2) {
    const v2 = data as {
      exportedAt?: string;
      logs?: unknown;
      checkIns?: unknown;
      clearances?: unknown;
    };
    if (!Array.isArray(v2.logs) || !Array.isArray(v2.checkIns)) return null;
    return {
      version: 2,
      exportedAt: typeof v2.exportedAt === "string" ? v2.exportedAt : new Date().toISOString(),
      logs: v2.logs.filter(isSessionLog),
      checkIns: v2.checkIns.filter(isCheckIn),
      clearances: Array.isArray(v2.clearances) ? v2.clearances.filter(isClearanceLog) : [],
    };
  }
  return null;
}

function isSessionLog(value: unknown): value is SessionLog {
  if (!value || typeof value !== "object") return false;
  const v = value as SessionLog;
  return (
    typeof v.id === "string" &&
    typeof v.date === "string" &&
    typeof v.programId === "string" &&
    typeof v.minutes === "number" &&
    typeof v.at === "number"
  );
}

function isCheckIn(value: unknown): value is CheckIn {
  if (!value || typeof value !== "object") return false;
  const v = value as CheckIn;
  return typeof v.date === "string" && typeof v.line === "string";
}

function isClearanceLog(value: unknown): value is ClearanceLog {
  if (!value || typeof value !== "object") return false;
  const v = value as ClearanceLog;
  return (
    typeof v.date === "string" &&
    (v.clearance === "clear" || v.clearance === "cautious")
  );
}

export function selectTodayCheckIn(checkIns: CheckIn[]): CheckIn | undefined {
  const date = todayKey();
  return checkIns.find((c) => c.date === date);
}

export function selectTodayClearance(clearances: ClearanceLog[]): Clearance | undefined {
  const date = todayKey();
  return clearances.find((c) => c.date === date)?.clearance;
}

export function selectTodayDone(logs: SessionLog[]): boolean {
  const date = todayKey();
  return heldLogs(logs).some((l) => l.date === date);
}

export function selectRecommendedId(checkIns: CheckIn[]): string {
  const check = selectTodayCheckIn(checkIns);
  if (check?.hotspot && check.hotspot !== "none") {
    if (check.hotspot === "neck" || check.hotspot === "shoulders") return "desk-reset";
    if (check.hotspot === "hips") return "hip-unstick";
    if (check.hotspot === "spine") return "spine-line";
  }
  if (check?.line === "tight") return "four-minute";
  if (check?.line === "loose") return "morning-plumb";
  return rotationIdForDate();
}

export function selectWeek(logs: SessionLog[]): { key: string; label: string; done: boolean }[] {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const done = new Set(heldLogs(logs).map((l) => l.date));
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = todayKey(d);
    return { key, label, done: done.has(key) };
  });
}

export function programTitle(id: string): string {
  return programById(id)?.title ?? "Session";
}
