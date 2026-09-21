import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import {
  computeLongest,
  computeStreak,
  programTitle,
  selectWeek,
  usePlumb,
} from "@/lib/plumb/store";
import { formatMinutes } from "@/lib/utils";

export const Route = createFileRoute("/progress")({ component: Progress });

function Progress() {
  const logs = usePlumb((s) => s.logs);
  const week = selectWeek(logs);
  const streak = computeStreak(logs);
  const longest = computeLongest(logs);
  const minutes = logs.reduce((n, l) => n + l.minutes, 0);
  const recent = [...logs].reverse().slice(0, 12);

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
          {recent.map((log) => (
            <li key={log.id} className="flex items-baseline justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{programTitle(log.programId)}</p>
                <p className="text-xs text-muted">{log.date}</p>
              </div>
              <p className="text-sm tabular-nums text-muted">{log.minutes} min</p>
            </li>
          ))}
        </ul>
      )}
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
