"use client";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  CheckCheck,
  Fingerprint,
  ShieldCheck,
} from "lucide-react";
import type { Session } from "@/lib/session";
import { clockTime } from "@/lib/session";
import type { PatrolSetup } from "@/hooks/use-patrol";
export function Summary({
  session,
  setup,
  reset,
}: {
  session: Session;
  setup: PatrolSetup;
  reset: () => void;
}) {
  const serious = [...session.evidence]
    .filter((e) => e.arrested)
    .sort(
      (a, b) =>
        ({ high: 3, medium: 2, low: 1 })[b.severity] -
        { high: 3, medium: 2, low: 1 }[a.severity],
    )[0];
  const duration = Math.floor(
    ((session.endedAt ?? session.startedAt) - session.startedAt) / 1000,
  );
  return (
    <main className="summary">
      <motion.section
        className="summary-file"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="summary-top">
          <span>
            <Fingerprint size={16} /> ATTENTION ENFORCEMENT DIVISION
          </span>
          <span>
            FINAL REPORT / {setup.mode === "demo" ? "REHEARSAL" : "LIVE AI"}
          </span>
        </div>
        <div className="closed-icon">
          <CheckCheck size={33} />
        </div>
        <span className="eyebrow">SHARING STOPPED · OFFICER OFF DUTY</span>
        <h1>
          CASE CLOSED<span className="blue-text">.</span>
        </h1>
        <p className="summary-verdict">
          {session.arrests === 0 && !session.evidence.length
            ? "No evidence. No judgment. This time."
            : session.arrests === 0
              ? "A model civilian. Suspicious, honestly."
              : session.score >= 60
                ? "Could have been worse."
                : "Your tabs have a better social life than you."}
        </p>
        <div className="summary-metrics">
          <div>
            <span className="field-label">PATROL DURATION</span>
            <strong>{clockTime(duration)}</strong>
          </div>
          <div>
            <span className="field-label">FINAL PRODUCTIVITY</span>
            <strong>
              {session.score}
              <small>%</small>
            </strong>
          </div>
          <div>
            <span className="field-label">ARRESTS</span>
            <strong>{session.arrests.toString().padStart(2, "0")}</strong>
          </div>
          <div>
            <span className="field-label">LONGEST CLEAN STREAK</span>
            <strong>{clockTime(session.longestStreak)}</strong>
          </div>
        </div>
        <div className="serious-offense">
          <span className="field-label">MOST SERIOUS OFFENSE</span>
          <p>
            {serious?.evidence ??
              "No confirmed crimes against productivity. Keep that energy."}
          </p>
        </div>
        <div className="dignity">
          <span>
            <ShieldCheck size={16} /> DIGNITY RECOVERED
          </span>
          <strong>{session.arrests ? "0%" : "100%"}</strong>
        </div>
        <button className="button-primary" onClick={reset}>
          START NEW PATROL <ArrowUpRight size={19} />
        </button>
        <p className="summary-note">
          Your screen is no longer being monitored. Case evidence lives only in
          this tab.
        </p>
      </motion.section>
    </main>
  );
}
