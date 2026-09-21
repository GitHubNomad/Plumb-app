import { createFileRoute, Link } from "@tanstack/react-router";
import { Disclaimer } from "@/components/disclaimer";
import { PoseMark } from "@/components/plumb-mark";
import { FOCUS_LABEL, programById } from "@/lib/plumb/catalog";
import { checkInReply, greeting, LINE_OPTIONS } from "@/lib/plumb/coach";
import {
  selectRecommendedId,
  selectTodayCheckIn,
  usePlumb,
} from "@/lib/plumb/store";
import type { Focus, LineFeel } from "@/lib/plumb/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/coach")({ component: Coach });

const HOTSPOTS: { id: Focus | "none"; label: string }[] = [
  { id: "none", label: "No hotspot" },
  { id: "neck", label: "Neck" },
  { id: "shoulders", label: "Shoulders" },
  { id: "spine", label: "Low back / spine" },
  { id: "hips", label: "Hips" },
];

function Coach() {
  const checkIns = usePlumb((s) => s.checkIns);
  const checkIn = selectTodayCheckIn(checkIns);
  const saveCheckIn = usePlumb((s) => s.saveCheckIn);
  const recId = selectRecommendedId(checkIns);
  const program = programById(recId);

  return (
    <main className="flex flex-1 flex-col px-5 pt-8 pb-6">
      <p className="text-[11px] font-medium tracking-widest text-muted uppercase">Coach</p>
      <h1 className="mt-1 font-display text-3xl font-semibold">{greeting()} How's the line?</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Honest check-in. I'll point you at a session. Not a diagnosis.
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-semibold">Feel</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {LINE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => saveCheckIn(opt.id, checkIn?.hotspot ?? "none")}
              className={cn(
                "min-h-16 rounded-md px-2 py-3 text-center transition-transform duration-150 active:scale-[0.96]",
                checkIn?.line === opt.id
                  ? "bg-pine text-pine-fg"
                  : "bg-surface text-fg shadow-[var(--shadow-border)]",
              )}
            >
              <span className="block text-sm font-semibold">{opt.label}</span>
              <span
                className={cn(
                  "mt-0.5 block text-[11px] leading-tight",
                  checkIn?.line === opt.id ? "text-pine-fg/70" : "text-muted",
                )}
              >
                {opt.hint}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold">Hotspot</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {HOTSPOTS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => saveCheckIn((checkIn?.line ?? "ok") as LineFeel, h.id)}
              className={cn(
                "min-h-11 rounded-md px-3 text-sm font-medium transition-transform duration-150 active:scale-[0.96]",
                checkIn?.hotspot === h.id
                  ? "bg-copper text-copper-fg"
                  : "bg-surface text-fg shadow-[var(--shadow-border)]",
              )}
            >
              {h.label}
            </button>
          ))}
        </div>
      </section>

      {checkIn ? (
        <section className="mt-8 rounded-lg bg-pine px-4 py-5 text-pine-fg">
          <p className="text-[11px] font-medium tracking-widest text-pine-fg/60 uppercase">
            Notes from the coach
          </p>
          <p className="mt-2 text-sm leading-relaxed">{checkInReply(checkIn)}</p>
          {program ? (
            <Link
              to="/session/$id"
              params={{ id: program.id }}
              className="mt-4 flex items-center gap-3 rounded-md bg-pine-fg/10 p-3"
            >
              <PoseMark focus={program.focus} className="text-pine-fg" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] tracking-widest text-pine-fg/60 uppercase">
                  {program.minutes} min · {FOCUS_LABEL[program.focus]}
                </p>
                <p className="font-display text-lg font-semibold">{program.title}</p>
              </div>
            </Link>
          ) : null}
        </section>
      ) : (
        <p className="mt-8 text-sm text-muted">Tap a feel to start. Hotspot is optional.</p>
      )}
      <Disclaimer className="mt-6" />
    </main>
  );
}
