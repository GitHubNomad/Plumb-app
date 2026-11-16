import { todayKey } from "@/lib/utils";
import { programById } from "../catalog";
import type { CheckIn, Focus, SessionLog } from "../types";

/** The four areas the map can tint. "full" steps spread across all of them. */
export type Area = Exclude<Focus, "full">;

export const AREAS: Area[] = ["neck", "shoulders", "spine", "hips"];

/** Which MuscleMap regions light up for each Plumb focus area. */
export const AREA_REGIONS: Record<Area, string[]> = {
  neck: ["neck", "upper-trapezius"],
  shoulders: ["deltoids", "rotator-cuff", "rhomboids"],
  spine: ["upper-back", "lower-trapezius", "lower-back"],
  hips: ["hip-flexors", "gluteal", "adductors", "hamstring"],
};

/**
 * Regions cut from a larger muscle (the trapezius, the quadriceps). They are
 * drawn over their parent only when tinted, so an idle figure looks whole.
 */
export const OVERLAY_REGIONS = new Set([
  "upper-trapezius",
  "lower-trapezius",
  "rhomboids",
  "hip-flexors",
]);

/** Silhouette parts that are never muscles. */
export const INERT_REGIONS = new Set(["head", "hair"]);

/** A whole-body step (standing line, lying still) counts a quarter toward each area. */
const FULL_SHARE = 0.25;

export type AreaLoad = Record<Area, number>;

function emptyLoad(): AreaLoad {
  return { neck: 0, shoulders: 0, spine: 0, hips: 0 };
}

/** First date key inside a window of `days` days ending on `today` (inclusive). */
export function windowStart(days: number, today = new Date()): string {
  const d = new Date(today);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return todayKey(d);
}

/**
 * Steps actually done per area over the last `days` days. Skipped steps don't
 * count. Logs don't record caution substitutions, so the program's own steps
 * stand in; substitutes share the program's focus, so the totals barely move.
 */
export function computeAreaLoad(logs: SessionLog[], days: number, today = new Date()): AreaLoad {
  const from = windowStart(days, today);
  const to = todayKey(today);
  const load = emptyLoad();
  for (const log of logs) {
    if (log.date < from || log.date > to) continue;
    const program = programById(log.programId);
    if (!program) continue;
    const skipped = new Set(log.skippedStepIds ?? []);
    for (const step of program.steps) {
      if (skipped.has(step.id)) continue;
      if (step.focus === "full") {
        for (const area of AREAS) load[area] += FULL_SHARE;
      } else {
        load[step.focus] += 1;
      }
    }
  }
  return load;
}

/** Areas flagged as a hotspot in any check-in inside the window. */
export function flaggedAreas(checkIns: CheckIn[], days: number, today = new Date()): Set<Area> {
  const from = windowStart(days, today);
  const to = todayKey(today);
  const flagged = new Set<Area>();
  for (const c of checkIns) {
    if (c.date < from || c.date > to) continue;
    if ((AREAS as string[]).includes(c.hotspot)) flagged.add(c.hotspot as Area);
  }
  return flagged;
}

/** 0–1 tint per region, relative to the most-worked area. Untouched regions are absent. */
export function regionIntensity(load: AreaLoad): Map<string, number> {
  const max = Math.max(...AREAS.map((a) => load[a]));
  const out = new Map<string, number>();
  if (max <= 0) return out;
  for (const area of AREAS) {
    if (load[area] <= 0) continue;
    for (const slug of AREA_REGIONS[area]) out.set(slug, load[area] / max);
  }
  return out;
}

/** Region slug → area, for outlining flagged areas. */
export function areaForRegion(slug: string): Area | undefined {
  return AREAS.find((a) => AREA_REGIONS[a].includes(slug));
}
