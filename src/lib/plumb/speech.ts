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

type VoiceInfo = Pick<SpeechSynthesisVoice, "lang" | "localService" | "default">;

/**
 * The voice to speak with, or null. Only voices the phone renders itself: a network voice would
 * send every cue (and, later, rep counts and measurements) off the device to be synthesised.
 * Prefers US English, then any English; the system default wins a tie.
 */
export function pickLocalVoice<V extends VoiceInfo>(voices: readonly V[]): V | null {
  const local = voices.filter((v) => v.localService);
  const rank = (v: V) =>
    (v.lang.replace("_", "-").toLowerCase() === "en-us"
      ? 0
      : v.lang.toLowerCase().startsWith("en")
        ? 2
        : 4) + (v.default ? 0 : 1);
  const english = local.filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (!english.length) return null;
  return english.reduce((best, v) => (rank(v) < rank(best) ? v : best));
}

/** Voices load asynchronously on Chrome; wait briefly for the list rather than speak with none. */
function loadVoices(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      window.clearTimeout(timer);
      resolve(synth.getVoices());
    };
    const timer = window.setTimeout(done, 1000);
    synth.addEventListener?.("voiceschanged", done, { once: true });
  });
}

/** Whether this phone has an on-device English voice. False means the voice coach stays silent. */
export async function localVoiceAvailable(): Promise<boolean> {
  if (!speechSupported()) return false;
  return pickLocalVoice(await loadVoices(window.speechSynthesis)) !== null;
}

/** Held so Chrome can't garbage-collect an utterance mid-sentence (it then never fires `onend`). */
let current: SpeechSynthesisUtterance | null = null;

/**
 * Speak `text`, replacing anything still being said. Resolves when speech ends, errors, or
 * times out, so callers can wait on it without risking a hang. Resolves at once if speech
 * is unavailable or the phone has no on-device voice (never falls back to a network voice).
 */
export async function speak(text: string): Promise<void> {
  if (!speechSupported() || !canSpeakNow()) return;
  const synth = window.speechSynthesis;
  const voice = pickLocalVoice(await loadVoices(synth));
  if (!voice) return;
  // cancel() right before speak() can drop the new utterance on Android, so only when needed.
  if (synth.speaking || synth.pending) synth.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    current = u;
    u.voice = voice;
    u.lang = voice.lang;
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
