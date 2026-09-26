import { afterEach, describe, expect, it, vi } from "vitest";
import { todayKey } from "@/lib/utils";
import { rotationIdForDate } from "./catalog";
import {
  computeLongest,
  computeStreak,
  parseBackup,
  selectRecommendedId,
  sessionHeld,
} from "./store";
import type { CheckIn, SessionLog } from "./types";

function log(date: string, extra: Partial<SessionLog> = {}): SessionLog {
  return { id: `${date}-x`, date, programId: "desk-reset", minutes: 5, at: 0, ...extra };
}

describe("sessionHeld", () => {
  it("counts legacy logs without step data as held", () => {
    expect(sessionHeld(log("2026-09-01"))).toBe(true);
  });
  it("does not count an all-skip session", () => {
    expect(sessionHeld(log("2026-09-01", { stepCount: 3, skippedStepIds: ["a", "b", "c"] }))).toBe(
      false,
    );
  });
  it("counts a session with at least one step done", () => {
    expect(sessionHeld(log("2026-09-01", { stepCount: 3, skippedStepIds: ["a", "b"] }))).toBe(true);
  });
});

describe("computeStreak", () => {
  const today = "2026-09-25";
  it("counts consecutive days ending today", () => {
    expect(computeStreak([log("2026-09-23"), log("2026-09-24"), log(today)], today)).toBe(3);
  });
  it("lets yesterday stand while today is still empty", () => {
    expect(computeStreak([log("2026-09-23"), log("2026-09-24")], today)).toBe(2);
  });
  it("resets after a gap day", () => {
    expect(computeStreak([log("2026-09-22"), log(today)], today)).toBe(1);
    expect(computeStreak([log("2026-09-22")], today)).toBe(0);
  });
  it("ignores an all-skip session", () => {
    const skipped = log(today, { stepCount: 2, skippedStepIds: ["a", "b"] });
    expect(computeStreak([log("2026-09-24"), skipped], today)).toBe(1);
  });
  it("crosses a month boundary", () => {
    expect(computeStreak([log("2026-08-31"), log("2026-09-01")], "2026-09-01")).toBe(2);
  });
});

describe("computeLongest", () => {
  it("finds the best run", () => {
    const logs = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-05", "2026-09-06"].map((d) =>
      log(d),
    );
    expect(computeLongest(logs)).toBe(3);
    expect(computeLongest([])).toBe(0);
  });
});

describe("parseBackup", () => {
  const good = log("2026-09-01");
  const check: CheckIn = { date: "2026-09-01", line: "tight", hotspot: "neck" };

  it("migrates v1 and drops the old undated clearance", () => {
    const parsed = parseBackup({
      version: 1,
      exportedAt: "2026-09-02T00:00:00.000Z",
      logs: [good],
      checkIns: [check],
      clearance: "clear",
    });
    expect(parsed).toEqual({
      version: 2,
      exportedAt: "2026-09-02T00:00:00.000Z",
      logs: [good],
      checkIns: [check],
      clearances: [],
    });
  });

  it("reads v2 and filters malformed entries", () => {
    const parsed = parseBackup({
      version: 2,
      logs: [good, { id: 1 }, null],
      checkIns: [check, { date: 5 }],
      clearances: [{ date: "2026-09-01", clearance: "cautious" }, { date: "x", clearance: "maybe" }],
    });
    expect(parsed?.logs).toEqual([good]);
    expect(parsed?.checkIns).toEqual([check]);
    expect(parsed?.clearances).toEqual([{ date: "2026-09-01", clearance: "cautious" }]);
  });

  it.each([
    ["null", null],
    ["a string", "plumb"],
    ["an unknown version", { version: 3, logs: [], checkIns: [] }],
    ["missing arrays", { version: 2 }],
  ])("rejects %s", (_label, input) => {
    expect(parseBackup(input)).toBeNull();
  });
});

describe("selectRecommendedId", () => {
  afterEach(() => vi.useRealTimers());
  const today = (c: Omit<CheckIn, "date">): CheckIn[] => [{ date: todayKey(), ...c }];

  it.each([
    ["neck", "desk-reset"],
    ["shoulders", "desk-reset"],
    ["hips", "hip-unstick"],
    ["spine", "spine-line"],
  ] as const)("routes a %s hotspot to %s", (hotspot, id) => {
    expect(selectRecommendedId(today({ line: "ok", hotspot }))).toBe(id);
  });

  it("routes by how the line feels when there is no hotspot", () => {
    expect(selectRecommendedId(today({ line: "tight", hotspot: "none" }))).toBe("four-minute");
    expect(selectRecommendedId(today({ line: "loose", hotspot: "none" }))).toBe("morning-plumb");
  });

  it("falls back to the day's rotation without a check-in today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-24T09:00:00")); // a Thursday
    const stale: CheckIn[] = [{ date: "2026-09-23", line: "tight", hotspot: "neck" }];
    expect(selectRecommendedId(stale)).toBe(rotationIdForDate());
    expect(rotationIdForDate()).toBe("desk-reset");
  });
});
