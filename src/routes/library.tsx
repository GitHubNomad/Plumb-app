import { createFileRoute, Link } from "@tanstack/react-router";
import { Disclaimer } from "@/components/disclaimer";
import { FOCUS_LABEL, PROGRAMS } from "@/lib/plumb/catalog";
import { PoseMark } from "@/components/plumb-mark";

export const Route = createFileRoute("/library")({ component: Library });

function Library() {
  return (
    <main className="flex flex-1 flex-col px-5 pt-8 pb-6">
      <p className="text-[11px] font-medium tracking-widest text-muted uppercase">Library</p>
      <h1 className="mt-1 font-display text-3xl font-semibold">Sessions</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Pick a length. Stay with the cues. The line does not care how impressive it looked.
      </p>
      <ul className="mt-6 flex flex-col gap-3">
        {PROGRAMS.map((program) => (
          <li key={program.id}>
            <Link
              to="/session/$id"
              params={{ id: program.id }}
              className="flex items-start gap-3 rounded-lg bg-surface p-4 shadow-[var(--shadow-border)] transition-transform duration-150 ease-out active:scale-[0.96]"
            >
              <PoseMark focus={program.focus} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium tracking-widest text-muted uppercase">
                  {program.minutes} min · {FOCUS_LABEL[program.focus]}
                </p>
                <h2 className="mt-0.5 font-display text-lg font-semibold">{program.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{program.blurb}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Disclaimer className="mt-6" />
    </main>
  );
}
