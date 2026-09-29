"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Clock3,
  FolderLock,
  Maximize2,
  Monitor,
  Radio,
  ScanLine,
  ShieldCheck,
  Square,
  Timer,
  TriangleAlert,
} from "lucide-react";
import type { Patrol } from "@/hooks/use-patrol";
import { labels, personas } from "@/lib/analysis";
import { clockTime, streakSeconds } from "@/lib/session";

export function Dashboard({ patrol }: { patrol: Patrol }) {
  const { session, setup, stream, analysis, scanning, error, now } = patrol;
  const preview = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = preview.current;
    if (video) {
      video.srcObject = stream;
      void video.play().catch(() => {});
    }
    return () => {
      if (video) video.srcObject = null;
    };
  }, [stream]);
  if (!session || !setup) return null;
  const officer = personas.find((p) => p.id === setup.persona)!;
  const classification = analysis?.classification ?? "neutral";
  const elapsed = Math.floor((now - session.startedAt) / 1000);
  const threat =
    classification === "distracting"
      ? 95
      : classification === "suspicious"
        ? 58
        : classification === "productive"
          ? 8
          : 28;
  return (
    <main className="dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">
            ATTENTION ENFORCEMENT / COMMAND CENTER
          </span>
          <h1>
            Patrol active<span className="blue-text">.</span>
          </h1>
        </div>
        <div className="patrol-actions">
          <span className={setup.mode === "demo" ? "demo-pill" : "live-pill"}>
            <span className="live-dot" />
            {setup.mode === "demo" ? "REHEARSAL · SCRIPTED" : "LIVE AI"}
          </span>
          <button className="button-stop" onClick={patrol.stop}>
            <Square size={13} fill="currentColor" /> Stop patrol
          </button>
        </div>
      </div>
      {setup.mode === "demo" && (
        <div className="rehearsal-banner">
          <TriangleAlert size={15} />
          <span>
            Rehearsal mode · Real screen feed, scripted evidence. No screenshots
            sent to Gemini.
          </span>
        </div>
      )}
      {error && (
        <div className="error-banner dashboard-error" role="alert">
          <TriangleAlert size={20} />
          <div>
            <strong>DISPATCH INTERRUPTED</strong>
            <p>{error}</p>
          </div>
          <button onClick={patrol.retry} className="button-secondary">
            Retry analysis <ArrowUpRight size={15} />
          </button>
        </div>
      )}
      <div className="command-grid">
        <section className="feed-panel">
          <div className="panel-heading">
            <span>
              <Monitor size={15} /> LIVE SCREEN FEED
            </span>
            <span className="feed-meta">
              {setup.mode === "demo" ? "LOCAL ONLY" : "TRANSIENT CAPTURE"}
              <span className="live-dot" />
            </span>
          </div>
          <div className="video-wrap">
            <video
              ref={preview}
              autoPlay
              muted
              playsInline
              aria-label="Your shared screen preview"
            />
            <div className="feed-corner corner-tl" />
            <div className="feed-corner corner-tr" />
            <div className="feed-corner corner-bl" />
            <div className="feed-corner corner-br" />
            <div className="bodycam-label">
              <span className="red-dot" /> BODYCAM / UNIT 001
            </div>
            <span className="feed-timestamp">{clockTime(elapsed)}</span>
            {scanning && <div className="scanline" />}
            <button
              className="expand-feed icon-button"
              title="Expand shared screen"
              aria-label="Expand shared screen"
              onClick={() => {
                void preview.current?.requestFullscreen().catch(() => {});
              }}
            >
              <Maximize2 size={17} />
            </button>
          </div>
          <div className="feed-footer">
            <span>
              <Radio size={14} />
              {error
                ? "ANALYSIS PAUSED · RETRY REQUIRED"
                : scanning
                  ? "ANALYZING EVIDENCE…"
                  : patrol.bust
                    ? "EVIDENCE ACQUIRED"
                    : "SCANNING FOR CRIMES AGAINST PRODUCTIVITY…"}
            </span>
            <span>{setup.mode === "demo" ? "SCRIPTED" : "GEMINI VISION"}</span>
          </div>
        </section>
        <section
          className={`status-panel ${classification}`}
          aria-live="polite"
        >
          <span className="eyebrow">CURRENT STATUS</span>
          <div className="status-icon">
            <ShieldCheck size={34} />
          </div>
          <h2>
            {error
              ? "Officer temporarily offline"
              : analysis
                ? labels[classification]
                : "Establishing the scene…"}
          </h2>
          <span className="classification-pill">
            {error
              ? "UNVERIFIED"
              : analysis
                ? classification.toUpperCase()
                : "AWAITING FIRST FRAME"}
          </span>
          <div className="status-detail">
            <span className="field-label">VISIBLE ACTIVITY</span>
            <p>
              {analysis?.activity ||
                "Your first screen frame is heading to dispatch."}
            </p>
            {analysis && (
              <span className="confidence">
                {Math.round(analysis.confidence * 100)}% confidence{" "}
                {setup.mode === "demo" && "· scripted"}
              </span>
            )}
          </div>
          <div className="threat-heading">
            <span className="field-label">DISTRACTION THREAT</span>
            <span>{analysis ? threat : "—"}%</span>
          </div>
          <div className="meter-track">
            <motion.div
              animate={{ width: `${analysis ? threat : 0}%` }}
              transition={{ duration: 0.7 }}
            />
          </div>
        </section>
      </div>
      <section className="metrics" aria-label="Session statistics">
        <div>
          <span className="field-label">
            <ShieldCheck size={14} /> PRODUCTIVITY
          </span>
          <span className="metric-value score-value">
            <motion.span
              key={session.score}
              initial={{ opacity: 0.4, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {session.score}
            </motion.span>
            <small>/100</small>
          </span>
          <span className="metric-note">
            Your session score. Keep it clean.
          </span>
        </div>
        <div>
          <span className="field-label">
            <Timer size={14} /> CLEAN STREAK
          </span>
          <span className="metric-value green-text">
            {clockTime(streakSeconds(session, now))}
          </span>
          <span className="metric-note">
            Time behaving, according to evidence.
          </span>
        </div>
        <div>
          <span className="field-label">
            <TriangleAlert size={14} /> ARRESTS
          </span>
          <span className="metric-value">
            {session.arrests.toString().padStart(2, "0")}
          </span>
          <span className="metric-note">
            Crimes against getting things done.
          </span>
        </div>
        <div>
          <span className="field-label">
            <Clock3 size={14} /> PATROL DURATION
          </span>
          <span className="metric-value">{clockTime(elapsed)}</span>
          <span className="metric-note">The internet is being watched.</span>
        </div>
      </section>
      <div className="lower-grid">
        <section className="locker">
          <div className="panel-heading">
            <span>
              <FolderLock size={16} /> EVIDENCE LOCKER
            </span>
            <span className="tiny-pill">{session.evidence.length} ENTRIES</span>
          </div>
          <div className="timeline" role="log" aria-label="Evidence timeline">
            <AnimatePresence initial={false}>
              {session.evidence.slice(0, 6).map((e) => (
                <motion.div
                  key={e.id}
                  className={`evidence-row ${e.classification}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <time>
                    {new Date(e.timestamp).toLocaleTimeString("en-GB")}
                  </time>
                  <span className="evidence-dot" />
                  <span>{e.activity}</span>
                  <span
                    className={`evidence-result ${e.arrested ? "arrested" : ""}`}
                  >
                    {e.arrested ? "BUSTED" : e.classification.toUpperCase()}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {!session.evidence.length && (
              <div className="empty-locker">
                <ScanLine size={23} />
                <p>No evidence yet. Enjoy your clean record while it lasts.</p>
              </div>
            )}
          </div>
          <p className="locker-note">
            Text evidence only. Screenshots are not intentionally stored.
          </p>
        </section>
        <aside className="officer-panel">
          <span className="eyebrow">OFFICER ON DUTY</span>
          <div className="duty-officer">
            <span className="officer-avatar">{officer.emoji}</span>
            <div>
              <h3>{officer.name}</h3>
              <span className="green-text">
                <span className="live-dot" /> ON YOUR CASE
              </span>
            </div>
          </div>
          <blockquote>“{officer.sample}”</blockquote>
          <div className="mission">
            <span className="field-label">YOUR MISSION</span>
            <p>{setup.goal}</p>
          </div>
          <span className="officer-id">BADGE #001 · EXCUSES NOT ACCEPTED</span>
        </aside>
      </div>
      <p className="dashboard-footnote">
        Share only what you want analyzed. Stop sharing at any time. Desktop
        Chrome or Edge gives the best patrol experience.
      </p>
    </main>
  );
}
