export type Focus = "neck" | "shoulders" | "spine" | "hips" | "full";

export type StepKind = "hold" | "reps" | "flow";

export type LineFeel = "tight" | "ok" | "loose";

export type Clearance = "clear" | "cautious";

export type Exercise = {
  id: string;
  name: string;
  cue: string;
  setup: string;
  kind: StepKind;
  focus: Focus;
  seconds?: number;
  reps?: number;
};

export type Program = {
  id: string;
  title: string;
  blurb: string;
  minutes: number;
  focus: Focus;
  vibe: string;
  steps: Exercise[];
};

export type SessionLog = {
  id: string;
  date: string;
  programId: string;
  minutes: number;
  at: number;
  /** Present on new logs. Older logs count as held. */
  stepCount?: number;
  skippedStepIds?: string[];
};

export type CheckIn = {
  date: string;
  line: LineFeel;
  hotspot: Focus | "none";
};

export type BackupV1 = {
  version: 1;
  exportedAt: string;
  logs: SessionLog[];
  checkIns: CheckIn[];
  clearance: Clearance | null;
};
