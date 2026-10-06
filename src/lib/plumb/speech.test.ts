import { describe, expect, it } from "vitest";
import { PROGRAMS } from "./catalog";
import { calloutFor, speechTimeoutMs, utteranceForStep } from "./speech";
import type { Exercise } from "./types";

const hold: Exercise = {
  id: "h",
  name: "Plumb line",
  setup: "Stand easy.",
  cue: "Lengthen up.",
  kind: "hold",
  focus: "full",
  seconds: 45,
};

describe("utteranceForStep", () => {
  it("reads name, duration, setup, and cue in order", () => {
    expect(utteranceForStep(hold)).toBe("Plumb line. 45 seconds. Stand easy. Lengthen up.");
  });

  it("says rep counts for rep steps", () => {
    expect(utteranceForStep({ ...hold, kind: "reps", seconds: undefined, reps: 8 })).toBe(
      "Plumb line. 8 reps. Stand easy. Lengthen up.",
    );
  });

  it("speaks minutes naturally", () => {
    expect(utteranceForStep({ ...hold, seconds: 60 })).toContain("1 minute.");
    expect(utteranceForStep({ ...hold, seconds: 90 })).toContain("1 minute 30 seconds.");
  });

  it.each(PROGRAMS.flatMap((p) => p.steps).map((s) => [s.id, s] as const))(
    "%s keeps the catalog cue verbatim",
    (_id, step) => {
      const text = utteranceForStep(step);
      expect(text).toContain(step.setup);
      expect(text).toContain(step.cue);
    },
  );
});

describe("calloutFor", () => {
  it("calls ten seconds on long enough holds", () => {
    expect(calloutFor(10, 45)).toBe("10 seconds.");
    expect(calloutFor(11, 45)).toBeNull();
  });

  it("stays quiet on short holds", () => {
    expect(calloutFor(10, 15)).toBeNull();
  });
});

describe("speechTimeoutMs", () => {
  it("scales with length and always leaves slack", () => {
    expect(speechTimeoutMs("one")).toBeGreaterThan(2000);
    expect(speechTimeoutMs("a ".repeat(50))).toBeGreaterThan(speechTimeoutMs("a ".repeat(10)));
  });
});
