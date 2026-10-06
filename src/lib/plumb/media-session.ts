import { useEffect, type RefObject } from "react";

export type EarbudControls = {
  playPause: () => void;
  next: () => void;
  previous: () => void;
};

export function mediaSessionSupported(): boolean {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

/**
 * A silent mono WAV, built at runtime so it costs nothing in the bundle. Chrome only routes
 * earbud and lock-screen buttons to a page that is playing an <audio> element, and on Android
 * it ignores clips under about five seconds, so this runs six and loops.
 */
export function silentWav(seconds = 6, rate = 8000): Blob {
  const samples = seconds * rate;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const ascii = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(at + i, s.charCodeAt(i));
  };
  ascii(0, "RIFF");
  v.setUint32(4, 36 + samples, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  v.setUint32(16, 16, true); // fmt chunk size
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true); // byte rate, 8-bit mono
  v.setUint16(32, 1, true); // block align
  v.setUint16(34, 8, true); // bits per sample
  ascii(36, "data");
  v.setUint32(40, samples, true);
  new Uint8Array(buf, 44).fill(128); // 8-bit PCM silence is the midpoint
  return new Blob([buf], { type: "audio/wav" });
}

const ACTIONS = ["play", "pause", "nexttrack", "previoustrack"] as const;

/**
 * While `active`, play a silent loop and route earbud / lock-screen buttons to `controls`:
 * play and pause both toggle, next and previous move between steps. Starting it needs a
 * user gesture, which the toggle that turns it on provides.
 */
export function useEarbudControls(
  active: boolean,
  controls: RefObject<EarbudControls | null>,
  title: string,
  album: string,
) {
  useEffect(() => {
    if (!active || !mediaSessionSupported()) return;
    const url = URL.createObjectURL(silentWav());
    const audio = new Audio(url);
    audio.loop = true;
    // With the setting remembered from an earlier visit, a fresh page has had no tap yet and
    // Chrome refuses play(). Retry on the first tap instead of sitting there switched on but dead.
    const keepPlaying = () =>
      void audio.play().catch(() => {
        document.addEventListener("pointerdown", keepPlaying, { once: true });
      });
    keepPlaying();
    // A spoken cue can take audio focus and pause the loop; without it the buttons go dead.
    audio.addEventListener("pause", keepPlaying);

    const ms = navigator.mediaSession;
    const handlers: Record<(typeof ACTIONS)[number], () => void> = {
      play: () => controls.current?.playPause(),
      pause: () => controls.current?.playPause(),
      nexttrack: () => controls.current?.next(),
      previoustrack: () => controls.current?.previous(),
    };
    for (const action of ACTIONS) {
      try {
        ms.setActionHandler(action, () => {
          handlers[action]();
          // The silent loop is the session's hold on the buttons; never let it stop.
          keepPlaying();
          ms.playbackState = "playing";
        });
      } catch {
        // Older browsers throw on actions they don't know.
      }
    }
    ms.playbackState = "playing";

    return () => {
      for (const action of ACTIONS) {
        try {
          ms.setActionHandler(action, null);
        } catch {
          // See above.
        }
      }
      ms.metadata = null;
      ms.playbackState = "none";
      document.removeEventListener("pointerdown", keepPlaying);
      audio.removeEventListener("pause", keepPlaying);
      audio.pause();
      audio.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [active, controls]);

  useEffect(() => {
    if (!active || !mediaSessionSupported() || typeof MediaMetadata === "undefined") return;
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist: "Plumb", album });
  }, [active, title, album]);
}
