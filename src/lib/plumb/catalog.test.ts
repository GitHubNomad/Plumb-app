import { describe, expect, it } from "vitest";
import { adaptProgram, PROGRAMS, programById } from "./catalog";

const timedSeconds = (steps: { seconds?: number }[]) =>
  steps.reduce((t, s) => t + (s.seconds ?? 0), 0);

describe("adaptProgram, not cautious", () => {
  it.each(PROGRAMS.map((p) => [p.id, p] as const))("%s is unchanged", (_id, program) => {
    const adapted = adaptProgram(program, false);
    expect(adapted.steps).toEqual(program.steps);
    expect(adapted.cautionNote).toBeNull();
    expect(adapted.removedIds).toEqual([]);
  });
});

describe("adaptProgram, cautious", () => {
  it.each(PROGRAMS.map((p) => [p.id, p] as const))("%s", (_id, program) => {
    const adapted = adaptProgram(program, true);
    const flagged = program.steps.filter((s) => s.caution).map((s) => s.id);
    const ids = adapted.steps.map((s) => s.id);

    // Never presents a flagged step.
    expect(adapted.steps.filter((s) => s.caution)).toEqual([]);
    // One-for-one: same length, no step twice.
    expect(adapted.steps).toHaveLength(program.steps.length);
    expect(new Set(ids).size).toBe(ids.length);
    // Reports exactly what happened.
    expect(adapted.removedIds).toEqual(flagged);
    expect(adapted.substitutedIds).toHaveLength(flagged.length);
    expect(adapted.cautionNote).not.toMatch(/swapped/);
    if (flagged.length > 0) {
      const n = flagged.length;
      expect(adapted.cautionNote).toContain(`${n} step${n === 1 ? "" : "s"} replaced`);
    } else {
      expect(adapted.cautionNote).toBe("Adjusted for caution — holds shortened.");
    }
    // Kept steps keep their position and are shortened (70%, floor 15s).
    program.steps.forEach((orig, i) => {
      if (orig.caution) return;
      const got = adapted.steps[i]!;
      expect(got.id).toBe(orig.id);
      if (orig.seconds) {
        expect(got.seconds).toBe(Math.max(15, Math.round(orig.seconds * 0.7)));
      }
    });
  });

  it("never presents the ragdoll hang (round-2 acceptance)", () => {
    for (const program of PROGRAMS) {
      expect(adaptProgram(program, true).steps.map((s) => s.id)).not.toContain("sl-hang");
    }
  });

  it("keeps spine-line substantial instead of thinning it to one hold", () => {
    const adapted = adaptProgram(programById("spine-line")!, true);
    expect(adapted.steps.filter((s) => s.seconds).length).toBeGreaterThanOrEqual(3);
    expect(timedSeconds(adapted.steps)).toBeGreaterThanOrEqual(60);
  });

  it("prefers a substitute with the removed step's focus", () => {
    // Desk Reset's two neck steps: the only unflagged neck step is the jaw unclench.
    const adapted = adaptProgram(programById("desk-reset")!, true);
    expect(adapted.substitutedIds[0]).toBe("ew-jaw");
  });
});
