import type { CheckIn, LineFeel } from "./types";

const DAY_LINES = [
  "Sunday is for stacking what the week scattered. Start with the line, not the list.",
  "Monday pulls forward. You go up.",
  "The chair will take what you don't claim. Claim the neck before lunch.",
  "Midweek wobble is normal. Recenter the hips; the rest follows.",
  "Thursday bodies forget they have a back. Remind yours.",
  "Friday wants to collapse. Collapse on purpose later — stack now.",
  "Saturday: longer session if you have it. The line remembers either way.",
];

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Morning.";
  if (h < 17) return "Afternoon.";
  return "Evening.";
}

export function dailyLine(date = new Date()): string {
  return DAY_LINES[date.getDay()] ?? DAY_LINES[1];
}

export function checkInReply(check: CheckIn): string {
  if (check.line === "tight" && (check.hotspot === "neck" || check.hotspot === "shoulders")) {
    return "Jaw first, then the blades. Desk Reset. Don't stretch into a fight.";
  }
  if (check.hotspot === "hips") {
    return "The chair won a round. Hip Unstick — slow 90/90, no heroics.";
  }
  if (check.hotspot === "spine") {
    return "Stack it, don't crank it. Spine Line, then stand and recheck.";
  }
  if (check.line === "tight") {
    return "Short fuse, short session. Four-Minute Line, then reassess.";
  }
  if (check.line === "loose") {
    return "Good. Don't waste it sitting down. Morning Plumb even if it isn't morning.";
  }
  return "Stay honest about the wobble. Today's rotation is enough.";
}

export const LINE_OPTIONS: { id: LineFeel; label: string; hint: string }[] = [
  { id: "tight", label: "Tight", hint: "Braced, clenched, short" },
  { id: "ok", label: "Stacked", hint: "Usable, a little noisy" },
  { id: "loose", label: "Easy", hint: "Long, quiet, honest" },
];
