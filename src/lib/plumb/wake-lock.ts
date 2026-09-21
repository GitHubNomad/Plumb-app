import { useEffect } from "react";

type Sentinel = { release: () => Promise<void> };

type WakeLockNav = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<Sentinel> };
};

/** Keep the screen awake while a hold is running. No-ops if the API is missing or denied. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const nav = navigator as WakeLockNav;
    if (!nav.wakeLock) return;

    let sentinel: Sentinel | null = null;
    let cancelled = false;

    const request = async () => {
      if (cancelled || document.visibilityState !== "visible") return;
      try {
        sentinel = await nav.wakeLock!.request("screen");
      } catch {
        sentinel = null;
      }
    };

    void request();
    const onVis = () => {
      if (document.visibilityState === "visible") void request();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      const current = sentinel;
      sentinel = null;
      if (current) void current.release();
    };
  }, [active]);
}
