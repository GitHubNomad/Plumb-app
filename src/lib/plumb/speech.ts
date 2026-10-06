import type { Exercise } from "./types";

/** Seconds-left marks that get a spoken callout during a timed step. */
export const CALLOUT_MARKS = [10] as const;

/** What the coach says when a step starts. Setup and cue are read verbatim from the catalog. */
export function utteranceForStep(exercise: Exercise): string {
  const amount =
    exercise.kind === "reps" && exercise.reps
      ? `${exercise.reps} reps.`
      : exercise.seconds
        ? `${spokenDuration(exercise.seconds)}.`
        : "";
  return [`${exercise.name}.`, amount, exercise.setup, exercise.cue].filter(Boolean).join(" ");
}

/** The callout for a seconds-left mark, or null. Short holds skip it: it would land on top of the cue. */
export function calloutFor(left: number, total: number): string | null {
  if (!(CALLOUT_MARKS as readonly number[]).includes(left)) return null;
  if (total < left * 2) return null;
  return `${left} seconds.`;
}

function spokenDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mins = `${m} minute${m === 1 ? "" : "s"}`;
  return s ? `${mins} ${s} seconds` : mins;
}

/**
 * How long to wait for `onend` before giving up. Chrome on Android sometimes never fires it,
 * and a timer waiting on a lost event would hang the session.
 */
export function speechTimeoutMs(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.round((words / 2.5) * 1000) + 2000;
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Chrome drops speech until the page has had a tap. Older browsers lack the API; assume yes. */
export function canSpeakNow(): boolean {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
    .userActivation;
  return ua ? ua.hasBeenActive : true;
}

/** Held so Chrome can't garbage-collect an utterance mid-sentence (it then never fires `onend`). */
let current: SpeechSynthesisUtterance | null = null;

/**
 * Speak `text`, replacing anything still being said. Resolves when speech ends, errors, or
 * times out, so callers can wait on it without risking a hang. Resolves at once if speech
 * is unavailable.
 */
export function speak(text: string): Promise<void> {
  if (!speechSupported() || !canSpeakNow()) return Promise.resolve();
  const synth = window.speechSynthesis;
  // cancel() right before speak() can drop the new utterance on Android, so only when needed.
  if (synth.speaking || synth.pending) synth.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    current = u;
    u.lang = "en-US";
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (current === u) current = null;
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, speechTimeoutMs(text));
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
  });
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}
