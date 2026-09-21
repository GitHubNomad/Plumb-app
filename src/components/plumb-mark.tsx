import { cn } from "@/lib/utils";

export function PlumbMark({ className, invert = false }: { className?: string; invert?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 20 28"
        className={cn("h-7 w-5", invert ? "text-pine-fg" : "text-copper")}
        aria-hidden="true"
      >
        <line
          x1="10"
          y1="1"
          x2="10"
          y2="18"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="10" cy="22" r="4.2" fill="currentColor" />
      </svg>
      <span
        className={cn(
          "font-display text-xl font-semibold tracking-tight",
          invert ? "text-pine-fg" : "text-fg",
        )}
      >
        Plumb
      </span>
    </span>
  );
}

export function PoseMark({
  focus = "full",
  className,
}: {
  focus?: "neck" | "shoulders" | "spine" | "hips" | "full";
  className?: string;
}) {
  const cy = { neck: 8, shoulders: 12, spine: 16, hips: 22, full: 16 }[focus];
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-12 w-12 text-pine", className)}
      aria-hidden="true"
    >
      <line x1="24" y1="4" x2="24" y2="44" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <circle cx="24" cy={cy} r="5" fill="none" className="text-copper" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="44" r="2" className="text-copper" fill="currentColor" />
    </svg>
  );
}
