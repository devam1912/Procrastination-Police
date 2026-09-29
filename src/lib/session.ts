import type { Analysis } from "./analysis";

export interface Evidence extends Analysis {
  id: number;
  timestamp: number;
  arrested: boolean;
}
export interface Session {
  startedAt: number;
  endedAt: number | null;
  score: number;
  arrests: number;
  cleanSince: number | null;
  longestStreak: number;
  evidence: Evidence[];
}
export const newSession = (now = Date.now()): Session => ({
  startedAt: now,
  endedAt: null,
  score: 75,
  arrests: 0,
  cleanSince: null,
  longestStreak: 0,
  evidence: [],
});
export const shouldArrest = (a: Analysis) =>
  a.classification === "distracting" && a.confidence >= 0.8;
export function streakSeconds(s: Session, now: number) {
  return s.cleanSince === null
    ? 0
    : Math.max(0, Math.floor(((s.endedAt ?? now) - s.cleanSince) / 1000));
}
export function recordAnalysis(
  s: Session,
  a: Analysis,
  now: number,
  arrested: boolean,
): Session {
  const delta = { productive: 4, neutral: 0, suspicious: -3, distracting: -12 }[
    a.classification
  ];
  const reliable = a.confidence >= 0.6;
  const clean = reliable && a.classification === "productive";
  return {
    ...s,
    score: Math.max(0, Math.min(100, s.score + (reliable ? delta : 0))),
    arrests: s.arrests + Number(arrested),
    longestStreak: Math.max(s.longestStreak, streakSeconds(s, now)),
    cleanSince: clean ? (s.cleanSince ?? now) : null,
    evidence: [
      { ...a, id: (s.evidence[0]?.id ?? 0) + 1, timestamp: now, arrested },
      ...s.evidence,
    ].slice(0, 100),
  };
}
export function closeSession(s: Session, now: number): Session {
  return {
    ...s,
    endedAt: now,
    longestStreak: Math.max(s.longestStreak, streakSeconds(s, now)),
    cleanSince: null,
  };
}
export function clockTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}
