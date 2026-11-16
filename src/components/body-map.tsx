import { useEffect, useState } from "react";
import { areaForRegion, INERT_REGIONS, OVERLAY_REGIONS, type Area } from "@/lib/plumb/body/areas";
import type { BodyFigure, BodyView, FigureKind } from "@/lib/plumb/body/types";

// Each figure is ~50 KB of path data, so it loads only when the map is shown.
const LOADERS: Record<FigureKind, () => Promise<{ default: BodyFigure }>> = {
  male: () => import("@/lib/plumb/body/paths-male"),
  female: () => import("@/lib/plumb/body/paths-female"),
};

const cache = new Map<FigureKind, BodyFigure>();

function useFigure(kind: FigureKind): BodyFigure | null {
  const [figure, setFigure] = useState<BodyFigure | null>(() => cache.get(kind) ?? null);
  useEffect(() => {
    let live = true;
    const hit = cache.get(kind);
    if (hit) {
      setFigure(hit);
      return;
    }
    setFigure(null);
    void LOADERS[kind]().then((m) => {
      cache.set(kind, m.default);
      if (live) setFigure(m.default);
    });
    return () => {
      live = false;
    };
  }, [kind]);
  return figure;
}

/** Copper mixed into the idle muscle colour; never fully transparent so low counts still read. */
function tint(t: number): string {
  const pct = Math.round(25 + 75 * t);
  return `color-mix(in srgb, var(--color-copper) ${pct}%, var(--color-line))`;
}

type Props = {
  kind: FigureKind;
  intensity: Map<string, number>;
  flagged: Set<Area>;
};

export function BodyMap({ kind, intensity, flagged }: Props) {
  const figure = useFigure(kind);
  return (
    <div className="grid grid-cols-2 gap-3" data-testid="body-map" data-figure={kind}>
      {(["front", "back"] as const).map((side) => (
        <figure key={side} className="flex flex-col items-center">
          {figure ? (
            <View view={figure[side]} intensity={intensity} flagged={flagged} />
          ) : (
            <div className="aspect-[727/1280] w-full animate-pulse rounded-md bg-surface" />
          )}
          <figcaption className="mt-1 text-[10px] tracking-widest text-muted uppercase">
            {side}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function View({
  view,
  intensity,
  flagged,
}: {
  view: BodyView;
  intensity: Map<string, number>;
  flagged: Set<Area>;
}) {
  const outlined = view.parts.filter((p) => {
    const area = areaForRegion(p.slug);
    return area && flagged.has(area) && !(OVERLAY_REGIONS.has(p.slug) && !intensity.has(p.slug));
  });
  return (
    <svg viewBox={view.viewBox} className="h-auto w-full" aria-hidden="true">
      {view.parts.map((p) => {
        const t = intensity.get(p.slug);
        if (t === undefined && OVERLAY_REGIONS.has(p.slug)) return null;
        let fill = "var(--color-line)";
        if (p.slug === "hair") fill = "var(--color-muted)";
        else if (!INERT_REGIONS.has(p.slug) && t !== undefined) fill = tint(t);
        return (
          <g
            key={p.slug}
            fill={fill}
            fillOpacity={p.slug === "hair" ? 0.45 : 1}
            stroke="var(--color-bg)"
            strokeWidth={3}
            data-region={p.slug}
            data-intensity={t === undefined ? undefined : t.toFixed(2)}
          >
            {p.d.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        );
      })}
      {outlined.map((p) => (
        <g
          key={`flag-${p.slug}`}
          fill="none"
          stroke="var(--color-pine)"
          strokeWidth={6}
          strokeDasharray="14 10"
          strokeLinejoin="round"
          data-flagged={p.slug}
        >
          {p.d.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      ))}
    </svg>
  );
}
