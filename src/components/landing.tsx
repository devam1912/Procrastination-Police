"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  LockKeyhole,
  Radio,
  ScanLine,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { Badge } from "./brand";
import { PrivacyDialog } from "./privacy-dialog";
import { personas, type Mode, type PersonaId } from "@/lib/analysis";
import type { PatrolSetup } from "@/hooks/use-patrol";

interface Props {
  start: (setup: PatrolSetup) => Promise<void>;
  starting: boolean;
  error: string | null;
}
export function Landing({ start, starting, error }: Props) {
  const [persona, setPersona] = useState<PersonaId>("gen-z");
  const [mode, setMode] = useState<Mode>("live");
  const [goal, setGoal] = useState("Finish my assignment");
  const [name, setName] = useState("Civilian");
  const [accessCode, setAccessCode] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [status, setStatus] = useState<{
    configured: boolean;
    accessCodeRequired: boolean;
  } | null>(null);
  const [statusError, setStatusError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/status", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setStatus)
      .catch(() => {
        if (!controller.signal.aborted) setStatusError(true);
      });
    return () => controller.abort();
  }, []);
  const selected = personas.find((p) => p.id === persona)!;
  const demoAllowed = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const invalid = goal.trim().length < 3;
  return (
    <main className="landing">
      <section className="hero" aria-labelledby="hero-title">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="eyebrow">
            <span className="live-dot" /> ATTENTION ENFORCEMENT DIVISION{" "}
            <span className="tiny-pill">EST. 2026</span>
          </div>
          <h1 id="hero-title">
            PROCRASTINATION
            <br />
            <span>
              POLICE<span className="hero-period">.</span>
            </span>
          </h1>
          <p className="hero-tagline">AI catches you wasting time.</p>
          <p className="hero-description">
            Your “just one more video” era is over.
            <br />
            Share your screen. Stay on task. Or face the roast.
          </p>
          <form
            className="patrol-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!invalid && !starting)
                void start({
                  persona,
                  mode,
                  goal: goal.trim(),
                  name: name.trim() || "Civilian",
                  accessCode,
                });
            }}
          >
            <label className="field-label" htmlFor="work-goal">
              WHAT SHOULD YOU BE DOING?
            </label>
            <div className="goal-input">
              <CrosshairIcon />
              <input
                id="work-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                maxLength={200}
                minLength={3}
                required
                placeholder="Finish my assignment"
                aria-describedby="goal-note"
              />
            </div>
            <p className="sr-only" id="goal-note">
              Your goal helps the officer distinguish work from distractions.
            </p>
            {demoAllowed && (
              <div className="mode-switch" aria-label="Analysis mode">
                <button
                  type="button"
                  className={mode === "live" ? "selected" : ""}
                  onClick={() => setMode("live")}
                  aria-pressed={mode === "live"}
                >
                  <span className="live-dot" /> Live AI
                </button>
                <button
                  type="button"
                  className={mode === "demo" ? "selected demo" : ""}
                  onClick={() => setMode("demo")}
                  aria-pressed={mode === "demo"}
                >
                  Rehearsal mode <span className="mode-tag">SCRIPTED</span>
                </button>
              </div>
            )}
            <p className={`mode-note ${mode === "demo" ? "amber-text" : ""}`}>
              {mode === "demo"
                ? "Real screen sharing. Scripted verdicts. No frames sent to AI."
                : status?.configured
                  ? "Gemini key configured · Frames analyzed every ~12 seconds"
                  : statusError
                    ? "Dispatch status unavailable. You can retry by reloading."
                    : status
                      ? "Gemini key required in .env for live analysis."
                      : "Checking dispatch connection…"}
            </p>
            {status?.accessCodeRequired && mode === "live" && (
              <label className="access-label">
                Patrol access code
                <input
                  type="password"
                  autoComplete="off"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  maxLength={128}
                  required
                />
              </label>
            )}
            <button
              className="button-primary start-button"
              disabled={starting || invalid}
              type="submit"
            >
              <Siren size={22} />
              {starting ? "AWAITING SCREEN PERMISSION…" : "START PATROL"}
              <ArrowUpRight size={22} />
            </button>
          </form>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          <p className="consent">
            By continuing, you voluntarily let an unnecessarily judgmental
            <br className="desktop-break" /> AI officer observe the screen you
            choose to share.
          </p>
          <button className="privacy-link" onClick={() => setPrivacy(true)}>
            <LockKeyhole size={13} /> Your screen. Your permission.{" "}
            <span>
              Privacy briefing <ArrowUpRight size={12} />
            </span>
          </button>
        </motion.div>
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
        >
          <div className="visual-top">
            <span>
              <Radio size={12} /> DISPATCH ONLINE
            </span>
            <span>UNIT / 001</span>
          </div>
          <div className="radar">
            <div className="radar-ring ring-one" />
            <div className="radar-ring ring-two" />
            <div className="radar-ring ring-three" />
            <div className="radar-axis axis-x" />
            <div className="radar-axis axis-y" />
            <div className="radar-sweep" />
            <div className="radar-blip blip-one" />
            <div className="radar-blip blip-two" />
            <Badge className="hero-badge" />
            <span className="radar-coord coord-top">N / 00°</span>
            <span className="radar-coord coord-left">W</span>
            <span className="radar-coord coord-right">E</span>
          </div>
          <div className="threat-card">
            <div>
              <span className="field-label">CURRENT THREAT LEVEL</span>
              <span className="threat-name">Your attention span.</span>
            </div>
            <span className="threat-critical">
              CRITICAL <span className="red-dot" />
            </span>
            <div className="threat-bars">
              {Array.from({ length: 24 }, (_, i) => (
                <i key={i} style={{ opacity: i > 19 ? 0.2 : 1 }} />
              ))}
            </div>
          </div>
          <div className="floating-ticket">
            <div className="ticket-top">
              <span className="red-dot" /> SAMPLE CASE FILE <span>#0042</span>
            </div>
            <p>“Just one more video.”</p>
            <div className="ticket-verdict">
              FAMOUS LAST WORDS <span>GUILTY ↗</span>
            </div>
          </div>
          <div className="visual-bottom">
            <span>SCANNING FOR CRIMES AGAINST PRODUCTIVITY</span>
            <ScanLine size={15} />
          </div>
        </motion.div>
      </section>
      <section
        className="officer-section"
        id="officers"
        aria-labelledby="officers-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">CHOOSE YOUR CONSEQUENCES</span>
            <h2 id="officers-title">Meet your arresting officer.</h2>
          </div>
          <span className="section-aside">
            5 personalities. Zero tolerance for your excuses.
          </span>
        </div>
        <div className="officer-grid">
          {personas.map((p) => (
            <button
              key={p.id}
              className={`officer-card ${persona === p.id ? "chosen" : ""}`}
              aria-pressed={persona === p.id}
              onClick={() => setPersona(p.id)}
            >
              <span className="officer-top">
                <span className="officer-avatar">{p.emoji}</span>
                <span className="officer-radio">
                  {persona === p.id && <Check size={12} />}
                </span>
              </span>
              <strong>{p.name}</strong>
              <span>{p.role}</span>
              <span className="officer-line" />
            </button>
          ))}
        </div>
        <div className="officer-quote">
          <span>OFFICER {selected.name.toUpperCase()} SAYS</span>
          <p>“{selected.sample}”</p>
          <label className="name-field">
            SUSPECT ALIAS
            <input
              aria-label="Suspect alias"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
            />
          </label>
        </div>
      </section>
      <section className="protocol" aria-labelledby="protocol-title">
        <div className="protocol-intro">
          <span className="eyebrow">THE PROTOCOL</span>
          <h2 id="protocol-title">
            A little surveillance.
            <br />A lot of accountability.
          </h2>
          <a href="#hero-title">
            Report for duty <ArrowDown size={15} />
          </a>
        </div>
        <div className="protocol-step">
          <span className="step-number">01 /</span>
          <ScanLine />
          <h3>Share the scene.</h3>
          <p>
            Choose a screen, window or tab. You’re always in control of the
            feed.
          </p>
        </div>
        <div className="protocol-step">
          <span className="step-number">02 /</span>
          <ShieldCheck />
          <h3>We build the case.</h3>
          <p>
            AI reads what’s actually on screen. A coding tutorial? You’re clear.
          </p>
        </div>
        <div className="protocol-step">
          <span className="step-number">03 /</span>
          <Siren />
          <h3>Get caught in 4K.</h3>
          <p>
            Go off task and meet your verdict, your sentence, and your very
            personal roast.
          </p>
        </div>
      </section>
      {privacy && <PrivacyDialog close={() => setPrivacy(false)} />}
    </main>
  );
}
function CrosshairIcon() {
  return <ScanLine size={18} />;
}
