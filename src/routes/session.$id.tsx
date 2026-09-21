import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, Pause, Play } from "lucide-react";
import { Disclaimer } from "@/components/disclaimer";
import { PoseMark } from "@/components/plumb-mark";
import { programById } from "@/lib/plumb/catalog";
import { SCREENING_QUESTION } from "@/lib/plumb/copy";
import { computeStreak, usePlumb } from "@/lib/plumb/store";
import type { Clearance, Exercise, Program } from "@/lib/plumb/types";
import { useWakeLock } from "@/lib/plumb/wake-lock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/session/$id")({ component: SessionPage });

function SessionPage() {
  const { id } = Route.useParams();
  const program = programById(id);
  const navigate = useNavigate();
  const completeSession = usePlumb((s) => s.completeSession);
  const logs = usePlumb((s) => s.logs);
  const clearance = usePlumb((s) => s.clearance);
  const setClearance = usePlumb((s) => s.setClearance);

  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [status, setStatus] = useState<Record<string, "done" | "skipped">>({});

  if (!program) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-display text-2xl font-semibold">No such session</h1>
        <Link to="/library" className="text-sm font-medium text-copper">
          Back to library
        </Link>
      </main>
    );
  }

  const session = program;
  const exercise = session.steps[step];
  const isLast = step >= session.steps.length - 1;
  const skippedIds = Object.entries(status)
    .filter(([, v]) => v === "skipped")
    .map(([k]) => k);
  const doneIds = Object.entries(status)
    .filter(([, v]) => v === "done")
    .map(([k]) => k);

  function advance(kind: "done" | "skipped") {
    if (!exercise) return;
    const nextStatus = { ...status, [exercise.id]: kind };
    if (isLast) {
      finishWith(nextStatus);
      return;
    }
    setStatus(nextStatus);
    setStep((s) => s + 1);
  }

  function finishWith(finalStatus: Record<string, "done" | "skipped">) {
    const skipped = Object.entries(finalStatus)
      .filter(([, v]) => v === "skipped")
      .map(([k]) => k);
    const done = Object.entries(finalStatus)
      .filter(([, v]) => v === "done")
      .map(([k]) => k);
    setStatus(finalStatus);
    if (done.length === 0) {
      setFinished(true);
      return;
    }
    completeSession({
      programId: session.id,
      minutes: minutesWorked(session, done),
      stepCount: session.steps.length,
      skippedStepIds: skipped,
    });
    setFinished(true);
  }

  if (!clearance) {
    return <ClearanceGate onChoose={setClearance} />;
  }

  if (finished) {
    const held = doneIds.length > 0 || Object.values(status).includes("done");
    const streak = computeStreak(logs);
    const skipCount = skippedIds.length;
    return (
      <main className="flex min-h-dvh flex-col bg-pine px-6 py-8 text-pine-fg">
        <p className="text-[11px] font-medium tracking-widest text-pine-fg/60 uppercase">
          {held ? "Complete" : "Skipped"}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.1] font-semibold">
          {held ? "The line held." : "That's a skip, not a session."}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-pine-fg/80">
          {held
            ? `${program.title} is done${skipCount ? `, ${skipCount} step${skipCount === 1 ? "" : "s"} skipped` : ""}. Streak is ${streak} day${streak === 1 ? "" : "s"}.`
            : "Tap-throughs don't move the streak. Come back when you can hold one."}
        </p>
        <div className="mt-auto flex flex-col gap-3">
          <Link
            to="/"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-copper text-sm font-semibold text-copper-fg transition-transform duration-150 active:scale-[0.96]"
          >
            Back to today
          </Link>
          <Link
            to="/library"
            className="inline-flex min-h-12 items-center justify-center rounded-md text-sm font-medium text-pine-fg/80"
          >
            Another session
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center gap-2 px-3 pt-4">
        <button
          type="button"
          onClick={() => (step === 0 ? navigate({ to: "/" }) : setStep((s) => Math.max(0, s - 1)))}
          className="inline-flex size-11 items-center justify-center rounded-md text-fg transition-transform duration-150 active:scale-[0.96]"
          aria-label={step === 0 ? "Exit session" : "Previous exercise"}
        >
          <ChevronLeft className="size-6" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium tracking-widest text-muted uppercase">
            {program.title}
          </p>
          <p className="text-xs text-muted tabular-nums">
            {step + 1} / {program.steps.length}
          </p>
        </div>
      </header>

      <ol className="mx-5 mt-2 flex gap-1" aria-hidden="true">
        {program.steps.map((s, i) => (
          <li
            key={s.id}
            className={cn(
              "h-1 flex-1 rounded-full",
              status[s.id] === "done"
                ? "bg-copper"
                : status[s.id] === "skipped"
                  ? "bg-muted/40"
                  : i === step
                    ? "bg-pine"
                    : "bg-line",
            )}
          />
        ))}
      </ol>

      {exercise ? (
        <ExerciseStep
          key={exercise.id}
          exercise={exercise}
          nextLabel={isLast ? "Finish" : "Next"}
          cautious={clearance === "cautious"}
          onSkip={() => advance("skipped")}
          onDone={() => advance("done")}
        />
      ) : null}
    </main>
  );
}

function minutesWorked(program: Program, doneIds: string[]): number {
  let seconds = 0;
  for (const id of doneIds) {
    const step = program.steps.find((s) => s.id === id);
    if (!step) continue;
    if (step.seconds) seconds += step.seconds;
    else if (step.reps) seconds += step.reps * 3;
  }
  const mins = Math.round(seconds / 60);
  return Math.min(program.minutes, Math.max(mins, 1));
}

function ClearanceGate({ onChoose }: { onChoose: (c: Clearance) => void }) {
  return (
    <main className="flex min-h-dvh flex-col bg-bg px-5 py-8">
      <p className="text-[11px] font-medium tracking-widest text-muted uppercase">Before you start</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">{SCREENING_QUESTION}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Honest answer. Plumb is not clearance, diagnosis, or a substitute for a clinician.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onChoose("clear")}
          className="min-h-12 rounded-md bg-copper text-sm font-semibold text-copper-fg transition-transform duration-150 active:scale-[0.96]"
        >
          No — I'm clear
        </button>
        <button
          type="button"
          onClick={() => onChoose("cautious")}
          className="min-h-12 rounded-md bg-surface text-sm font-semibold text-fg shadow-[var(--shadow-border)] transition-transform duration-150 active:scale-[0.96]"
        >
          Yes — I'll skip anything that hurts
        </button>
      </div>
      <Disclaimer className="mt-auto pt-8" />
    </main>
  );
}

function ExerciseStep({
  exercise,
  nextLabel,
  cautious,
  onSkip,
  onDone,
}: {
  exercise: Exercise;
  nextLabel: string;
  cautious: boolean;
  onSkip: () => void;
  onDone: () => void;
}) {
  const total = exercise.seconds ?? 0;
  const timed = exercise.kind !== "reps";
  const totalMs = total * 1000;

  const [endsAt, setEndsAt] = useState<number | null>(() =>
    timed && totalMs > 0 ? Date.now() + totalMs : null,
  );
  const [pausedMs, setPausedMs] = useState<number | null>(null);
  const [left, setLeft] = useState(total);
  const [repsDone, setRepsDone] = useState(false);

  const running = timed && endsAt !== null && pausedMs === null && left > 0;
  useWakeLock(running);

  useEffect(() => {
    if (!timed || totalMs <= 0) return;

    const paint = () => {
      const remaining =
        pausedMs !== null ? pausedMs : endsAt !== null ? Math.max(0, endsAt - Date.now()) : 0;
      setLeft(Math.ceil(remaining / 1000));
    };

    paint();
    if (pausedMs !== null || endsAt === null) return;

    const id = window.setInterval(paint, 250);
    const onVis = () => paint();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [timed, totalMs, endsAt, pausedMs]);

  const ready = timed ? left === 0 : repsDone;
  const progress = timed && total > 0 ? 1 - left / total : repsDone ? 1 : 0;

  const clock = useMemo(() => {
    const m = Math.floor(left / 60);
    const s = left % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [left]);

  function togglePause() {
    if (!timed || left === 0) return;
    if (pausedMs !== null) {
      setEndsAt(Date.now() + pausedMs);
      setPausedMs(null);
      return;
    }
    if (endsAt === null) return;
    setPausedMs(Math.max(0, endsAt - Date.now()));
    setEndsAt(null);
  }

  return (
    <section className="flex flex-1 flex-col px-5 pt-6 pb-8">
      <div className="flex items-start gap-3">
        <PoseMark focus={exercise.focus} />
        <div>
          <p className="text-[11px] font-medium tracking-widest text-muted uppercase">
            {exercise.kind === "reps"
              ? `${exercise.reps} reps`
              : exercise.kind === "flow"
                ? "Flow"
                : "Hold"}
          </p>
          <h1 className="font-display text-3xl leading-tight font-semibold">{exercise.name}</h1>
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-fg">{exercise.setup}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{exercise.cue}</p>
      {cautious ? (
        <p className="mt-2 text-sm text-copper">You flagged caution. Skip the moment it hurts.</p>
      ) : null}

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        {timed ? (
          <>
            <TimerRing
              progress={progress}
              label={left === 0 ? "Held" : clock}
              left={left}
              total={total}
            />
            <button
              type="button"
              onClick={togglePause}
              disabled={left === 0}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-medium text-muted disabled:opacity-40"
            >
              {running ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
              {left === 0 ? "Done" : running ? "Pause" : "Resume"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setRepsDone(true)}
            className={cn(
              "flex size-36 flex-col items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.96]",
              repsDone ? "bg-pine text-pine-fg" : "bg-surface text-fg shadow-[var(--shadow-border)]",
            )}
          >
            {repsDone ? <Check className="size-8" strokeWidth={2.4} /> : null}
            <span className="font-display text-2xl tabular-nums">{exercise.reps}</span>
            <span className="text-xs tracking-wide uppercase">{repsDone ? "Marked" : "reps"}</span>
          </button>
        )}
      </div>

      <div className="flex gap-3">
        {!ready ? (
          <button
            type="button"
            onClick={onSkip}
            className="min-h-12 flex-1 rounded-md text-sm font-medium text-muted"
          >
            Skip
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDone}
          disabled={!ready}
          className="min-h-12 flex-[2] rounded-md bg-copper text-sm font-semibold text-copper-fg transition-transform duration-150 active:scale-[0.96] disabled:opacity-40"
        >
          {nextLabel}
        </button>
      </div>
      <Disclaimer className="mt-4 text-center" />
    </section>
  );
}

function TimerRing({
  progress,
  label,
  left,
  total,
}: {
  progress: number;
  label: string;
  left: number;
  total: number;
}) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, progress)));
  const live =
    left === 0
      ? "Hold complete"
      : left <= 5 || left % 10 === 0 || left === total
        ? `${left} seconds remaining`
        : "";
  const announced = useRef(live);
  if (live) announced.current = live;

  return (
    <div className="relative size-44">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="64" cy="64" r={r} fill="none" className="stroke-line" strokeWidth="6" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          className="stroke-copper"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-4xl tabular-nums">
        {label}
      </span>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announced.current}
      </p>
    </div>
  );
}
