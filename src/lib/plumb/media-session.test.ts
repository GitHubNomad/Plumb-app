import { describe, expect, it } from "vitest";
import { silentWav } from "./media-session";

describe("silentWav", () => {
  it("is a valid PCM WAV of the requested length, all silence", async () => {
    const bytes = new Uint8Array(await silentWav(6, 8000).arrayBuffer());
    const text = (at: number, n: number) => String.fromCharCode(...bytes.slice(at, at + n));
    const view = new DataView(bytes.buffer);
    expect(text(0, 4)).toBe("RIFF");
    expect(text(8, 4)).toBe("WAVE");
    expect(view.getUint32(24, true)).toBe(8000);
    expect(view.getUint32(40, true)).toBe(48000);
    expect(bytes.length).toBe(44 + 48000);
    expect(bytes.slice(44).every((b) => b === 128)).toBe(true);
  });

  it("runs past Chrome's five-second media threshold by default", async () => {
    const view = new DataView(await silentWav().arrayBuffer());
    expect(view.getUint32(40, true) / view.getUint32(24, true)).toBeGreaterThan(5);
  });
});
