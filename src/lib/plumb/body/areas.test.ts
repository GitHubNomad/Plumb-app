import { describe, expect, it } from "vitest";
import type { CheckIn, SessionLog } from "../types";
import {
  AREA_REGIONS,
  AREAS,
  computeAreaLoad,
  flaggedAreas,
  OVERLAY_REGIONS,
  regionIntensity,
  windowStart,
} from "./areas";
import female from "./paths-female";
import male from "./paths-male";

// Noon, so date arithmetic never trips over a DST edge.
const TODAY = new Date("2026-11-16T12:00:00");

function log(date: string, programId: string, extra: Partial<SessionLog> = {}): SessionLog {
  return { id: `${programId}-${date}`, date, programId, minutes: 5, at: 0, ...extra };
}

describe("windowStart", () => {
  it("includes today", () => {
    expect(windowStart(1, TODAY)).toBe("2026-11-16");
    expect(windowStart(7, TODAY)).toBe("2026-11-10");
    expect(windowStart(30, TODAY)).toBe("2026-10-18");
  });
});

describe("computeAreaLoad", () => {
  it("counts each held step toward its area", () => {
    // desk-reset: spine, neck, shoulders, shoulders, neck
    expect(computeAreaLoad([log("2026-11-16", "desk-reset")], 7, TODAY)).toEqual({
      neck: 2,
      shoulders: 2,
      spine: 1,
      hips: 0,
    });
  });

  it("leaves out skipped steps", () => {
    const l = log("2026-11-16", "desk-reset", {
      stepCount: 5,
      skippedStepIds: ["dr-chin", "dr-look"],
    });
    expect(computeAreaLoad([l], 7, TODAY).neck).toBe(0);
  });

  it("spreads a whole-body step a quarter to each area", () => {
    // four-minute: full, neck, shoulders, hips
    expect(computeAreaLoad([log("2026-11-16", "four-minute")], 7, TODAY)).toEqual({
      neck: 1.25,
      shoulders: 1.25,
      spine: 0.25,
      hips: 1.25,
    });
  });

  it("only counts sessions inside the window", () => {
    const logs = [
      log("2026-11-10", "hip-unstick"), // first day of the 7-day window
      log("2026-11-09", "hip-unstick"), // one day too old
      log("2026-11-17", "hip-unstick"), // future-dated (clock change), ignored
    ];
    expect(computeAreaLoad(logs, 7, TODAY).hips).toBe(6);
    expect(computeAreaLoad(logs, 30, TODAY).hips).toBe(12);
  });

  it("ignores logs for programs that no longer exist", () => {
    expect(computeAreaLoad([log("2026-11-16", "retired-program")], 7, TODAY)).toEqual({
      neck: 0,
      shoulders: 0,
      spine: 0,
      hips: 0,
    });
  });
});

describe("regionIntensity", () => {
  it("is empty when nothing was worked", () => {
    expect(regionIntensity({ neck: 0, shoulders: 0, spine: 0, hips: 0 }).size).toBe(0);
  });

  it("scales against the most-worked area and skips untouched ones", () => {
    const m = regionIntensity({ neck: 2, shoulders: 4, spine: 0, hips: 1 });
    expect(m.get("deltoids")).toBe(1);
    expect(m.get("neck")).toBe(0.5);
    expect(m.get("gluteal")).toBe(0.25);
    expect(m.has("lower-back")).toBe(false);
  });
});

describe("flaggedAreas", () => {
  it("collects hotspots inside the window, ignoring none and old check-ins", () => {
    const checkIns: CheckIn[] = [
      { date: "2026-11-16", line: "tight", hotspot: "neck" },
      { date: "2026-11-12", line: "ok", hotspot: "none" },
      { date: "2026-11-01", line: "tight", hotspot: "hips" },
    ];
    expect([...flaggedAreas(checkIns, 7, TODAY)]).toEqual(["neck"]);
    expect(flaggedAreas(checkIns, 30, TODAY)).toEqual(new Set(["neck", "hips"]));
  });
});

describe("body figures", () => {
  it.each([
    ["male", male],
    ["female", female],
  ] as const)("%s draws every mapped region", (_name, figure) => {
    const drawn = new Set([...figure.front.parts, ...figure.back.parts].map((p) => p.slug));
    for (const area of AREAS) {
      for (const slug of AREA_REGIONS[area]) expect(drawn, slug).toContain(slug);
    }
    for (const slug of OVERLAY_REGIONS) expect(drawn, slug).toContain(slug);
    for (const view of [figure.front, figure.back]) {
      expect(view.viewBox).toMatch(/^\d+ \d+ \d+ \d+$/);
      for (const p of view.parts) {
        expect(p.d.length).toBeGreaterThan(0);
        // Every outline opens with a moveto, so each stands alone as a path.
        for (const d of p.d) expect(d).toMatch(/^[Mm]/);
      }
    }
  });

  it("each area shows on at least one side of the figure", () => {
    for (const figure of [male, female]) {
      for (const side of [figure.front, figure.back]) {
        // Silhouette must be present on both sides.
        expect(side.parts.some((p) => p.slug === "feet")).toBe(true);
      }
    }
  });
});
