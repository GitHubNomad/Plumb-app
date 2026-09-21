import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey } from "@/lib/utils";
import { programById, rotationIdForDate } from "./catalog";
import type { CheckIn, Focus, LineFeel, SessionLog } from "./types";

type PlumbState = {
  logs: SessionLog[];
  checkIns: CheckIn[];
  completeSession: (programId: string, minutes: number) => void;
  saveCheckIn: (line: LineFeel, hotspot: Focus | "none") => void;
};

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueDates(logs: SessionLog[]): string[] {
  return [...new Set(logs.map((l) => l.date))].sort();
}

export function computeStreak(logs: SessionLog[], today = todayKey()): number {
  const set = new Set(logs.map((l) => l.date));
  let streak = 0;
  const cursor = new Date(`${today}T12:00:00`);
  // Allow streak to count yesterday if today is still empty.
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
  const days = uniqueDates(logs);
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
      completeSession: (programId, minutes) => {
        const date = todayKey();
        set({
          logs: [
            ...get().logs,
            { id: uid(), date, programId, minutes, at: Date.now() },
          ],
        });
      },
      saveCheckIn: (line, hotspot) => {
        const date = todayKey();
        const rest = get().checkIns.filter((c) => c.date !== date);
        set({ checkIns: [...rest, { date, line, hotspot }] });
      },
    }),
    { name: "plumb-coach", skipHydration: true },
  ),
);

export function selectTodayCheckIn(checkIns: CheckIn[]): CheckIn | undefined {
  const date = todayKey();
  return checkIns.find((c) => c.date === date);
}

export function selectTodayDone(logs: SessionLog[]): boolean {
  const date = todayKey();
  return logs.some((l) => l.date === date);
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
  const day = today.getDay(); // 0 sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const done = new Set(logs.map((l) => l.date));
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
