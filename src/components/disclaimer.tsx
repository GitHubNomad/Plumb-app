import { DISCLAIMER } from "@/lib/plumb/copy";
import { cn } from "@/lib/utils";

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] leading-relaxed text-muted", className)}>{DISCLAIMER}</p>
  );
}
