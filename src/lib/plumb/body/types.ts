export type BodyPart = {
  /** MuscleMap region slug, kebab-case (e.g. "upper-trapezius"). */
  slug: string;
  /**
   * SVG path data, one string per outline (shared, left, right). Kept apart
   * because some start with a relative "m", which only reads correctly as the
   * first command of its own path.
   */
  d: string[];
};

export type BodyView = {
  viewBox: string;
  parts: BodyPart[];
};

export type BodyFigure = {
  front: BodyView;
  back: BodyView;
};

export type FigureKind = "male" | "female";
