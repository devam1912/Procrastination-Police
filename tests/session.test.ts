import { describe, expect, it } from "vitest";
import { analysisSchema } from "../src/lib/analysis";
import { demoAnalysis } from "../src/lib/demo";
import {
  clockTime,
  closeSession,
  newSession,
  recordAnalysis,
  shouldArrest,
  streakSeconds,
} from "../src/lib/session";

describe("patrol evidence and scoring", () => {
  it("accepts all rehearsal stages and officer personalities", () => {
    for (const persona of [
      "gen-z",
      "indian-mom",
      "professor",
      "manager",
      "terminator",
    ] as const)
      for (let i = 0; i < 4; i++)
        expect(analysisSchema.safeParse(demoAnalysis(i, persona)).success).toBe(
          true,
        );
  });
  it("only arrests confidently distracting activity", () => {
    expect(shouldArrest(demoAnalysis(3, "gen-z"))).toBe(true);
    expect(
      shouldArrest({ ...demoAnalysis(3, "gen-z"), confidence: 0.79 }),
    ).toBe(false);
    expect(shouldArrest(demoAnalysis(2, "gen-z"))).toBe(false);
  });
  it("scores sensibly, bounds the score, and starts streak only after evidence", () => {
    let s = newSession(1000);
    expect(streakSeconds(s, 20_000)).toBe(0);
    s = recordAnalysis(s, demoAnalysis(0, "gen-z"), 5000, false);
    expect(s.score).toBe(79);
    expect(streakSeconds(s, 15_000)).toBe(10);
    s = recordAnalysis(s, demoAnalysis(1, "gen-z"), 16_000, false);
    s = recordAnalysis(s, demoAnalysis(2, "gen-z"), 20_000, false);
    expect(s.score).toBe(80);
    expect(s.longestStreak).toBe(15);
    expect(s.cleanSince).toBeNull();
    for (let i = 0; i < 200; i++)
      s = recordAnalysis(s, demoAnalysis(3, "gen-z"), 25_000 + i, true);
    expect(s.score).toBe(0);
    expect(s.evidence).toHaveLength(100);
    expect(s.arrests).toBe(200);
  });
  it("freezes closed sessions and preserves longest streak", () => {
    const s = recordAnalysis(
      newSession(1000),
      demoAnalysis(0, "gen-z"),
      2000,
      false,
    );
    const closed = closeSession(s, 12_000);
    expect(closed.longestStreak).toBe(10);
    expect(closed.endedAt).toBe(12_000);
    expect(streakSeconds(closed, 40_000)).toBe(0);
    expect(clockTime(149)).toBe("02:29");
    expect(clockTime(-1)).toBe("00:00");
  });
  it("does not improve scores using uncertain evidence", () => {
    const s = recordAnalysis(
      newSession(),
      { ...demoAnalysis(0, "gen-z"), confidence: 0.4 },
      Date.now(),
      false,
    );
    expect(s.score).toBe(75);
    expect(s.cleanSince).toBeNull();
  });
  it("rejects malformed model output", () => {
    expect(
      analysisSchema.safeParse({ ...demoAnalysis(0, "gen-z"), confidence: 10 })
        .success,
    ).toBe(false);
    expect(
      analysisSchema.safeParse({
        ...demoAnalysis(0, "gen-z"),
        roast: "x".repeat(500),
      }).success,
    ).toBe(false);
  });
});
