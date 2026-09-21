import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Disclaimer } from "@/components/disclaimer";
import { PlumbMark, PoseMark } from "@/components/plumb-mark";
import { FOCUS_LABEL, programById } from "@/lib/plumb/catalog";
import { dailyLine, greeting } from "@/lib/plumb/coach";
import {
  computeStreak,
  selectRecommendedId,
  selectTodayDone,
  selectWeek,
  usePlumb,
} from "@/lib/plumb/store";
import { formatDayLabel } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const logs = usePlumb((s) => s.logs);
  const checkIns = usePlumb((s) => s.checkIns);
  const recId = selectRecommendedId(checkIns);
  const doneToday = selectTodayDone(logs);
  const week = selectWeek(logs);
  const streak = computeStreak(logs);
  const program = programById(recId);

  return (
    <main className="flex flex-1 flex-col">
      <header className="bg-pine px-5 pb-8 pt-7 text-pine-fg">
        <div className="stagger-in flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <PlumbMark invert />
            <p className="text-xs font-medium tracking-wide text-pine-fg/70">{formatDayLabel()}</p>
          </div>
          <div>
            <p className="text-sm text-pine-fg/70">{greeting()} I'm your coach.</p>
            <h1 className="mt-1 font-display text-[2rem] leading-[1.15] font-semibold">
              {doneToday ? "Line held." : "Stand the line."}
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-pine-fg/80">{dailyLine()}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 min-w-14 flex-col items-center justify-center rounded-md bg-pine-fg/10 px-3">
              <span className="font-display text-2xl leading-none tabular-nums">{streak}</span>
              <span className="mt-0.5 text-[10px] tracking-wide text-pine-fg/65 uppercase">
                streak
              </span>
            </div>
            <ol className="flex flex-1 justify-between gap-1">
              {week.map((d) => (
                <li key={d.key} className="flex flex-col items-center gap-1">
                  <span
                    className={
                      d.done
                        ? "flex size-7 items-center justify-center rounded-full bg-copper text-copper-fg"
                        : "flex size-7 items-center justify-center rounded-full bg-pine-fg/10 text-pine-fg/55"
                    }
                  >
                    {d.done ? <Check className="size-3.5" strokeWidth={3} /> : null}
                  </span>
                  <span className="text-[10px] tracking-wide text-pine-fg/55">{d.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </header>

      <section className="flex flex-1 flex-col gap-4 px-5 py-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold">
            {doneToday ? "Another pass" : "Today's session"}
          </h2>
          <Link to="/library" className="text-sm font-medium text-copper">
            All sessions
          </Link>
        </div>

        {program ? (
          <Link
            to="/session/$id"
            params={{ id: program.id }}
            className="block rounded-lg bg-surface p-4 shadow-[var(--shadow-border)] transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            <div className="flex items-start gap-3">
              <PoseMark focus={program.focus} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium tracking-widest text-muted uppercase">
                  {program.vibe} · {program.minutes} min · {FOCUS_LABEL[program.focus]}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold">{program.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{program.blurb}</p>
              </div>
            </div>
            <span className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-copper px-4 text-sm font-semibold text-copper-fg">
              {doneToday ? "Repeat session" : "Start session"}
              <ArrowRight className="size-4" />
            </span>
          </Link>
        ) : null}

        <Link
          to="/coach"
          className="rounded-lg bg-bg px-1 py-3 text-sm text-muted transition-colors duration-150"
        >
          Tight, stacked, or easy today?{" "}
          <span className="font-medium text-fg">Check in with the coach →</span>
        </Link>

        <Disclaimer className="pb-2" />
      </section>
    </main>
  );
}
