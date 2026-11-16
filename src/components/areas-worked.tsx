import { useMemo, useState } from "react";
import { BodyMap } from "@/components/body-map";
import { AREAS, computeAreaLoad, flaggedAreas, regionIntensity } from "@/lib/plumb/body/areas";
import type { FigureKind } from "@/lib/plumb/body/types";
import { FOCUS_LABEL } from "@/lib/plumb/catalog";
import { usePlumb } from "@/lib/plumb/store";
import { cn } from "@/lib/utils";

const WINDOWS = [7, 30] as const;

export function AreasWorked() {
  const logs = usePlumb((s) => s.logs);
  const checkIns = usePlumb((s) => s.checkIns);
  const figure = usePlumb((s) => s.figure);
  const setFigure = usePlumb((s) => s.setFigure);
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(7);
  const load = useMemo(() => computeAreaLoad(logs, days), [logs, days]);
  const intensity = useMemo(() => regionIntensity(load), [load]);
  const flagged = useMemo(() => flaggedAreas(checkIns, days), [checkIns, days]);
  const total = AREAS.reduce((n, a) => n + load[a], 0);

  return (
    <section className="mt-8" aria-labelledby="areas-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="areas-heading" className="font-display text-lg font-semibold">
          Where you've worked
        </h2>
        <Segmented
          label="Time window"
          options={WINDOWS.map((d) => ({ value: d, label: `${d} days` }))}
          value={days}
          onChange={setDays}
        />
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Steps you held, by area. Darker means more work there. It isn't a pain map.
      </p>

      <div className="mt-4 rounded-lg bg-surface p-4">
        <BodyMap kind={figure} intensity={intensity} flagged={flagged} />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {flagged.size ? (
              <>
                <span
                  aria-hidden="true"
                  className="mr-1 inline-block h-0 w-4 border-t-2 border-dashed border-pine align-middle"
                />
                Flagged tight in a check-in
              </>
            ) : null}
          </p>
          <Segmented
            label="Body figure"
            options={[
              { value: "male" as FigureKind, label: "Male" },
              { value: "female" as FigureKind, label: "Female" },
            ]}
            value={figure}
            onChange={setFigure}
          />
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Figure from{" "}
          <a href="/third-party-notices.txt" className="underline underline-offset-2">
            MuscleMap by Melih Colpan (MIT)
          </a>
        </p>
      </div>

      {total === 0 ? (
        <p className="mt-3 text-sm text-muted">No steps held in the last {days} days.</p>
      ) : (
        <ul
          className="mt-3 grid grid-cols-2 gap-2"
          aria-label={`Steps held in the last ${days} days`}
        >
          {AREAS.map((a) => (
            <li
              key={a}
              className="flex items-baseline justify-between rounded-md bg-surface px-3 py-2"
            >
              <span className="text-sm">
                {FOCUS_LABEL[a]}
                {flagged.has(a) ? <span className="sr-only"> (flagged tight)</span> : null}
              </span>
              <span className="text-sm tabular-nums text-muted" data-area={a}>
                {formatSteps(load[a])}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Whole-body steps count as quarters, so totals can be fractional; show one decimal only when needed. */
function formatSteps(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex rounded-md bg-bg p-0.5 shadow-[var(--shadow-border)]"
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-11 rounded px-3 text-xs font-medium transition-colors duration-150",
            o.value === value ? "bg-pine text-pine-fg" : "text-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
