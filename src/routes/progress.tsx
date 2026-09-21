import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Disclaimer } from "@/components/disclaimer";
import {
  buildBackup,
  computeLongest,
  computeStreak,
  programTitle,
  selectWeek,
  sessionHeld,
  usePlumb,
} from "@/lib/plumb/store";
import { formatMinutes, todayKey } from "@/lib/utils";

export const Route = createFileRoute("/progress")({ component: Progress });

function Progress() {
  const logs = usePlumb((s) => s.logs);
  const replaceFromBackup = usePlumb((s) => s.replaceFromBackup);
  const week = selectWeek(logs);
  const streak = computeStreak(logs);
  const longest = computeLongest(logs);
  const minutes = logs.filter(sessionHeld).reduce((n, l) => n + l.minutes, 0);
  const recent = [...logs].reverse().slice(0, 12);
  const fileRef = useRef<HTMLInputElement>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  function downloadBackup() {
    const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plumb-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg("Backup saved to your downloads. Stays on this device unless you copy it.");
  }

  function onPickFile(file: File | undefined) {
    if (!file) return;
    void file.text().then((text) => {
      try {
        const ok = replaceFromBackup(JSON.parse(text));
        setBackupMsg(ok ? "Backup restored." : "That file isn't a Plumb backup.");
      } catch {
        setBackupMsg("That file isn't a Plumb backup.");
      }
    });
  }

  return (
    <main className="flex flex-1 flex-col px-5 pt-8 pb-6">
      <p className="text-[11px] font-medium tracking-widest text-muted uppercase">Progress</p>
      <h1 className="mt-1 font-display text-3xl font-semibold">The ledger</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Days you stood the line. Not trophies — receipts.
      </p>

      <ol className="mt-6 flex justify-between gap-1">
        {week.map((d) => (
          <li key={d.key} className="flex flex-col items-center gap-1">
            <span
              className={
                d.done
                  ? "flex size-9 items-center justify-center rounded-full bg-copper text-copper-fg"
                  : "flex size-9 items-center justify-center rounded-full bg-surface text-muted"
              }
            >
              {d.done ? <Check className="size-4" strokeWidth={2.6} /> : null}
            </span>
            <span className="text-[10px] text-muted">{d.label}</span>
          </li>
        ))}
      </ol>

      <dl className="mt-6 grid grid-cols-3 gap-2">
        <Stat label="Streak" value={String(streak)} />
        <Stat label="Best" value={String(longest)} />
        <Stat label="Time" value={formatMinutes(minutes)} />
      </dl>

      <h2 className="mt-8 font-display text-lg font-semibold">Recent</h2>
      {recent.length === 0 ? (
        <div className="mt-3 rounded-lg bg-surface p-5">
          <p className="text-sm text-muted">No sessions yet. Today is a clean page.</p>
          <Link
            to="/"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-copper"
          >
            Start today's session
          </Link>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line rounded-lg bg-surface">
          {recent.map((log) => {
            const skips = log.skippedStepIds?.length ?? 0;
            const held = sessionHeld(log);
            return (
              <li key={log.id} className="flex items-baseline justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{programTitle(log.programId)}</p>
                  <p className="text-xs text-muted">
                    {log.date}
                    {skips ? ` · ${skips} skipped` : ""}
                    {!held ? " · tap-through" : ""}
                  </p>
                </div>
                <p className="text-sm tabular-nums text-muted">{log.minutes} min</p>
              </li>
            );
          })}
        </ul>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Backup</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Logs stay on this phone. Download a copy before you wipe it.
        </p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={downloadBackup}
            className="min-h-11 flex-1 rounded-md bg-pine text-sm font-semibold text-pine-fg transition-transform duration-150 active:scale-[0.96]"
          >
            Download backup
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="min-h-11 flex-1 rounded-md bg-surface text-sm font-semibold text-fg shadow-[var(--shadow-border)] transition-transform duration-150 active:scale-[0.96]"
          >
            Restore
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
        </div>
        {backupMsg ? <p className="mt-2 text-sm text-muted">{backupMsg}</p> : null}
      </section>
      <Disclaimer className="mt-6" />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface px-3 py-3 text-center">
      <dt className="text-[10px] tracking-widest text-muted uppercase">{label}</dt>
      <dd className="mt-1 font-display text-2xl tabular-nums">{value}</dd>
    </div>
  );
}
