import type { Exercise, Focus, Program } from "./types";

export const FOCUS_LABEL: Record<Focus, string> = {
  neck: "Neck",
  shoulders: "Shoulders",
  spine: "Spine",
  hips: "Hips",
  full: "Full line",
};

export const PROGRAMS: Program[] = [
  {
    id: "morning-plumb",
    title: "Morning Plumb",
    blurb: "Wake the line. Five quiet minutes before the day pulls you crooked.",
    minutes: 8,
    focus: "full",
    vibe: "Rise",
    steps: [
      {
        id: "mp-stand",
        name: "Find the bob",
        setup: "Stand easy. Soft knees. Arms hang.",
        cue: "Imagine a weight dropping from the crown through the floor. Lengthen up it. Don't freeze.",
        kind: "hold",
        focus: "full",
        seconds: 45,
      },
      {
        id: "mp-roll",
        name: "Shoulder pour",
        setup: "Same stance. Slow circles.",
        cue: "Pour the shoulders back and down, then reverse. Keep the ribs quiet.",
        kind: "reps",
        focus: "shoulders",
        reps: 8,
      },
      {
        id: "mp-cat",
        name: "Cat to table",
        setup: "Hands under shoulders, knees under hips.",
        cue: "Round the whole spine, then lengthen it long. Move like you're drawing a slow comma.",
        kind: "flow",
        focus: "spine",
        seconds: 60,
      },
      {
        id: "mp-lunge",
        name: "Half-kneel open",
        setup: "Right knee down, left foot forward. Then switch.",
        cue: "Tuck the back hip under. Reach the same-side arm up. Breathe into the front of the hip.",
        kind: "hold",
        focus: "hips",
        seconds: 40,
      },
      {
        id: "mp-chin",
        name: "Chin glide",
        setup: "Sit or stand tall.",
        cue: "Slide the chin straight back, like a drawer. Two breaths at the backstop, then release.",
        kind: "reps",
        focus: "neck",
        reps: 8,
        caution: "neck-endrange",
      },
    ],
  },
  {
    id: "desk-reset",
    title: "Desk Reset",
    blurb: "For the hour you forgot you had a neck. Chair optional, spine not.",
    minutes: 7,
    focus: "neck",
    vibe: "Unhook",
    steps: [
      {
        id: "dr-scan",
        name: "Seat reset",
        setup: "Sit on your sit bones, feet planted.",
        cue: "Let the tail heavy. Grow tall without lifting the chin. Soften the jaw.",
        kind: "hold",
        focus: "spine",
        seconds: 30,
      },
      {
        id: "dr-chin",
        name: "Drawer chin",
        setup: "Eyes level with the far wall.",
        cue: "Chin glides back. Hold one breath. Release 80%, not all the way to the poke.",
        kind: "reps",
        focus: "neck",
        reps: 10,
        caution: "neck-endrange",
      },
      {
        id: "dr-blade",
        name: "Blade slides",
        setup: "Arms by your sides.",
        cue: "Slide the shoulder blades down the back pockets. Hold, then melt. No shrugging.",
        kind: "reps",
        focus: "shoulders",
        reps: 8,
      },
      {
        id: "dr-open",
        name: "Chest gate",
        setup: "Clasp hands behind you, or hold the chair back.",
        cue: "Open the collarbones. Keep the low ribs stacked. Breathe into the sternum.",
        kind: "hold",
        focus: "shoulders",
        seconds: 40,
      },
      {
        id: "dr-look",
        name: "Slow look-aways",
        setup: "Long neck, quiet shoulders.",
        cue: "Turn the head as if reading a high shelf. Pause at each end. No forcing the last inch.",
        kind: "flow",
        focus: "neck",
        seconds: 50,
        caution: "neck-endrange",
      },
    ],
  },
  {
    id: "hip-unstick",
    title: "Hip Unstick",
    blurb: "Hips that forgot they hinge. Undo the chair without a gym.",
    minutes: 10,
    focus: "hips",
    vibe: "Unstick",
    steps: [
      {
        id: "hu-rock",
        name: "Figure-four rock",
        setup: "On your back. Ankle on opposite knee.",
        cue: "Draw the thigh in until you feel the outer hip. Rock two degrees, not twenty.",
        kind: "hold",
        focus: "hips",
        seconds: 45,
      },
      {
        id: "hu-switch",
        name: "Other figure-four",
        setup: "Switch legs.",
        cue: "Same story, other hip. Keep the neck heavy on the floor.",
        kind: "hold",
        focus: "hips",
        seconds: 45,
      },
      {
        id: "hu-90",
        name: "90/90 sit",
        setup: "Both knees bent 90°, one in front, one to the side.",
        cue: "Sit tall between the legs. If the back rounds, sit on a book.",
        kind: "hold",
        focus: "hips",
        seconds: 40,
      },
      {
        id: "hu-90b",
        name: "90/90, other side",
        setup: "Swing both legs the other way.",
        cue: "Same height. Same quiet ribs. Breathe into the stuck side.",
        kind: "hold",
        focus: "hips",
        seconds: 40,
      },
      {
        id: "hu-hinge",
        name: "Soft hinge",
        setup: "Stand, hands on thighs.",
        cue: "Push the hips back like closing a car door with them. Spine long. Stand by squeezing the glutes.",
        kind: "reps",
        focus: "hips",
        reps: 10,
      },
      {
        id: "hu-bridge",
        name: "Quiet bridge",
        setup: "On your back, feet under knees.",
        cue: "Peel the hips up. Pause at the top without flaring ribs. Lower slow.",
        kind: "reps",
        focus: "hips",
        reps: 8,
      },
    ],
  },
  {
    id: "spine-line",
    title: "Spine Line",
    blurb: "Stack the vertebrae like a true vertical. Slow, not heroic.",
    minutes: 11,
    focus: "spine",
    vibe: "Stack",
    steps: [
      {
        id: "sl-hang",
        name: "Ragdoll hang",
        setup: "Feet under hips. Soft knees. Fold.",
        cue: "Let the head hang. Sway nothing. Breathe into the back of the ribs.",
        kind: "hold",
        focus: "spine",
        seconds: 40,
        caution: "inversion",
      },
      {
        id: "sl-roll",
        name: "Roll to stand",
        setup: "From the hang.",
        cue: "Stack one vertebra at a time. Head last. Arrive taller than you left.",
        kind: "flow",
        focus: "spine",
        seconds: 40,
        caution: "inversion",
      },
      {
        id: "sl-book",
        name: "Open book",
        setup: "Side-lying, knees bent, arms stacked.",
        cue: "Open the top arm like a book. Eyes follow. Keep the knees heavy.",
        kind: "reps",
        focus: "spine",
        reps: 6,
      },
      {
        id: "sl-book2",
        name: "Open book, other side",
        setup: "Roll over.",
        cue: "Same pages. Don't yank the shoulder — let the ribs rotate you.",
        kind: "reps",
        focus: "spine",
        reps: 6,
      },
      {
        id: "sl-wall",
        name: "Wall angels",
        setup: "Back to a wall. Soft knees. Low ribs in.",
        cue: "Slide the arms up and down the wall. If they leave, shrink the range.",
        kind: "reps",
        focus: "shoulders",
        reps: 8,
      },
      {
        id: "sl-stand",
        name: "The line again",
        setup: "Stand. Eyes on a point.",
        cue: "Crown up, floor down. Weight even on both feet. Stay for six breaths.",
        kind: "hold",
        focus: "full",
        seconds: 40,
      },
    ],
  },
  {
    id: "evening-unwind",
    title: "Evening Unwind",
    blurb: "Put the day down. Floor work, low lights, no heroics.",
    minutes: 10,
    focus: "full",
    vibe: "Settle",
    steps: [
      {
        id: "ew-jaw",
        name: "Jaw unclench",
        setup: "Lie on your back. Tongue on the palate.",
        cue: "Let the teeth part. Exhale longer than you inhale. Shoulders melt.",
        kind: "hold",
        focus: "neck",
        seconds: 40,
      },
      {
        id: "ew-knees",
        name: "Knees to side",
        setup: "Knees bent, feet wide.",
        cue: "Drop both knees one way, then the other. Head turns opposite if it feels good.",
        kind: "flow",
        focus: "spine",
        seconds: 50,
      },
      {
        id: "ew-fig",
        name: "Supine figure-four",
        setup: "Ankle on knee, both sides.",
        cue: "Hold each side until the hip sighs. No yanking.",
        kind: "hold",
        focus: "hips",
        seconds: 50,
      },
      {
        id: "ew-child",
        name: "Wide child's pose",
        setup: "Knees out, arms long, forehead down.",
        cue: "Heavy hips. Long exhales. If the knees complain, pad them.",
        kind: "hold",
        focus: "spine",
        seconds: 50,
        caution: "inversion",
      },
      {
        id: "ew-savasana",
        name: "Nothing, on purpose",
        setup: "On your back. Palms up.",
        cue: "Stop coaching yourself. Let the floor hold the line.",
        kind: "hold",
        focus: "full",
        seconds: 70,
      },
    ],
  },
  {
    id: "four-minute",
    title: "Four-Minute Line",
    blurb: "The emergency unkink. Between meetings, after the train, before you snap.",
    minutes: 4,
    focus: "full",
    vibe: "Now",
    steps: [
      {
        id: "fm-stand",
        name: "Drop the bob",
        setup: "Stand. Two feet. That's it.",
        cue: "Weight even. Soft knees. Long neck. Three slow breaths.",
        kind: "hold",
        focus: "full",
        seconds: 25,
      },
      {
        id: "fm-chin",
        name: "Six chins",
        setup: "Wherever you are.",
        cue: "Chin drawer, six times. Quiet mouth.",
        kind: "reps",
        focus: "neck",
        reps: 6,
        caution: "neck-endrange",
      },
      {
        id: "fm-blade",
        name: "Pockets",
        setup: "Arms hang.",
        cue: "Blades into back pockets. Hold a breath. Release. Repeat.",
        kind: "reps",
        focus: "shoulders",
        reps: 6,
      },
      {
        id: "fm-hinge",
        name: "Hip shut",
        setup: "Hands on thighs.",
        cue: "Hinge, stand, squeeze. Four times. Done.",
        kind: "reps",
        focus: "hips",
        reps: 4,
      },
    ],
  },
];

export function programById(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}

export function programsForFocus(focus: Focus | "none"): Program[] {
  if (focus === "none") return PROGRAMS;
  const hit = PROGRAMS.filter((p) => p.focus === focus);
  return hit.length ? hit : PROGRAMS;
}

const ROTATION = [
  "morning-plumb",
  "desk-reset",
  "hip-unstick",
  "spine-line",
  "desk-reset",
  "hip-unstick",
  "evening-unwind",
] as const;

export function rotationIdForDate(date = new Date()): string {
  return ROTATION[date.getDay()] ?? "morning-plumb";
}

const HOLD_SCALE = 0.7;
const MIN_HOLD = 15;

export type AdaptedProgram = Program & {
  cautionNote: string | null;
  removedIds: string[];
  substitutedIds: string[];
};

function shortenHold(step: Exercise): Exercise {
  if (!step.seconds) return step;
  return { ...step, seconds: Math.max(MIN_HOLD, Math.round(step.seconds * HOLD_SCALE)) };
}

/**
 * Unflagged steps from the whole catalog, best substitute first: same focus as the removed
 * step, then the program's focus, then anything. Within each band, timed work (holds and
 * flows) ranks ahead of reps so a thinned program keeps its time under tension.
 */
function substituteCandidates(removed: Exercise, programFocus: Focus): Exercise[] {
  const band = (s: Exercise) =>
    s.focus === removed.focus ? 0 : s.focus === programFocus ? 1 : 2;
  const timed = (s: Exercise) => (s.seconds ? 0 : 1);
  return PROGRAMS.flatMap((p) => p.steps)
    .filter((s) => !s.caution)
    .sort((a, b) => band(a) - band(b) || timed(a) - timed(b));
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * Cautious mode: replace each inversion / neck-endrange step one-for-one with the nearest
 * unflagged step, and shorten every hold. The note reports removals and substitutions
 * separately so it never claims a swap that didn't happen.
 */
export function adaptProgram(program: Program, cautious: boolean): AdaptedProgram {
  if (!cautious) {
    return { ...program, cautionNote: null, removedIds: [], substitutedIds: [] };
  }

  const used = new Set(program.steps.filter((s) => !s.caution).map((s) => s.id));
  const removedIds: string[] = [];
  const substitutedIds: string[] = [];
  const steps: Exercise[] = [];

  for (const step of program.steps) {
    if (!step.caution) {
      steps.push(shortenHold(step));
      continue;
    }
    removedIds.push(step.id);
    const sub = substituteCandidates(step, program.focus).find((s) => !used.has(s.id));
    if (sub) {
      used.add(sub.id);
      substitutedIds.push(sub.id);
      steps.push(shortenHold(sub));
    }
  }

  const removedN = removedIds.length;
  const subN = substitutedIds.length;
  let cautionNote: string;
  if (removedN === 0) {
    cautionNote = "Adjusted for caution — holds shortened.";
  } else if (subN === removedN) {
    cautionNote = `Adjusted for caution — ${plural(removedN, "step")} replaced with ${removedN === 1 ? "a gentler one" : "gentler ones"}, holds shortened.`;
  } else {
    cautionNote = `Adjusted for caution — ${plural(removedN, "step")} removed, ${subN} substituted, holds shortened.`;
  }

  return { ...program, steps, cautionNote, removedIds, substitutedIds };
}
