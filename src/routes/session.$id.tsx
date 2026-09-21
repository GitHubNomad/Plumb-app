import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, Pause, Play } from "lucide-react";
import { PoseMark } from "@/components/plumb-mark";
import { programById } from "@/lib/plumb/catalog";
import { computeStreak, usePlumb } from "@/lib/plumb/store";
import type { Exercise } from "@/lib/plumb/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/session/$id")({ component: SessionPage });

function SessionPage() {
  const { id } = Route.useParams();
  const program = programById(id);
  const navigate = useNavigate();
  const completeSession = usePlumb((s) => s.completeSession);
  const logs = usePlumb((s) => s.logs);

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [startedAt] = useState(() => Date.now());

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

  function finish() {
    const elapsed = Math.round((Date.now() - startedAt) / 60000);
    const minutes = Math.max(1, elapsed || session.minutes);
    completeSession(session.id, minutes);
    setDone(true);
  }

  function next() {
    if (isLast) finish();
    else setStep((s) => s + 1);
  }

  if (done) {
    const streak = computeStreak(logs);
    return (
      <main className="flex min-h-dvh flex-col bg-pine px-6 py-8 text-pine-fg">
        <p className="text-[11px] font-medium tracking-widest text-pine-fg/60 uppercase">Complete</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.1] font-semibold">The line held.</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-pine-fg/80">
          {program.title} is done. Streak is {streak} day{streak === 1 ? "" : "s"}. Don't undo it in
          the chair.
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
              i < step ? "bg-copper" : i === step ? "bg-pine" : "bg-line",
            )}
          />
        ))}
      </ol>

      {exercise ? (
        <ExerciseStep
          key={exercise.id}
          exercise={exercise}
          onNext={next}
          nextLabel={isLast ? "Finish" : "Next"}
        />
      ) : null}
    </main>
  );
}

function ExerciseStep({
  exercise,
  onNext,
  nextLabel,
}: {
  exercise: Exercise;
  onNext: () => void;
  nextLabel: string;
}) {
  const total = exercise.seconds ?? 0;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(exercise.kind !== "reps");
  const [repsDone, setRepsDone] = useState(false);

  useEffect(() => {
    if (!running || exercise.kind === "reps" || total <= 0) return;
    const id = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, exercise.kind, total]);

  const timed = exercise.kind !== "reps";
  const ready = timed ? left === 0 : repsDone;
  const progress = timed && total > 0 ? 1 - left / total : repsDone ? 1 : 0;

  const clock = useMemo(() => {
    const m = Math.floor(left / 60);
    const s = left % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [left]);

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

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        {timed ? (
          <>
            <TimerRing progress={progress} label={left === 0 ? "Held" : clock} />
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
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
            onClick={onNext}
            className="min-h-12 flex-1 rounded-md text-sm font-medium text-muted"
          >
            Skip
          </button>
        ) : null}
        <button
          type="button"
          onClick={onNext}
          className="min-h-12 flex-[2] rounded-md bg-copper text-sm font-semibold text-copper-fg transition-transform duration-150 active:scale-[0.96]"
        >
          {nextLabel}
        </button>
      </div>
    </section>
  );
}

function TimerRing({ progress, label }: { progress: number; label: string }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, progress)));
  return (
    <div className="relative size-44">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="64" cy="64" r={r} fill="none" className="stroke-line" strokeWidth="6" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          className="stroke-copper transition-[stroke-dashoffset] duration-1000 ease-linear"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-4xl tabular-nums">
        {label}
      </span>
    </div>
  );
}
