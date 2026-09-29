"use client";
import { useRef } from "react";
import { useDialog } from "@/hooks/use-dialog";
import { motion } from "motion/react";
import {
  ArrowRight,
  Fingerprint,
  Siren,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Analysis } from "@/lib/analysis";
import type { PatrolSetup } from "@/hooks/use-patrol";
export function Busted({
  analysis,
  setup,
  arrests,
  dismiss,
  stop,
  volume,
  setSound,
}: {
  analysis: Analysis;
  setup: PatrolSetup;
  arrests: number;
  dismiss: () => void;
  stop: () => void;
  volume: number;
  setSound: (volume: number) => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useDialog(dialog, dismiss);
  return (
    <motion.div
      ref={dialog}
      className="busted-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="busted-title"
    >
      <div className="emergency-wash" />
      <div className="busted-content">
        <div className="busted-label">
          <Siren size={19} /> ATTENTION ENFORCEMENT · EVIDENCE ACQUIRED
          <button
            className="icon-button"
            aria-label={volume ? "Mute siren" : "Unmute siren"}
            onClick={() => setSound(volume ? 0 : 0.35)}
          >
            {volume ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
        <motion.h1
          id="busted-title"
          initial={{ scale: 1.18, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14 }}
        >
          BUSTED<span>!</span>
        </motion.h1>
        <p className="busted-subtitle">
          You have the right to remain productive.
        </p>
        <motion.section
          className="case-file"
          initial={{ y: 35, opacity: 0, rotate: -1 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="case-file-header">
            <span>
              <Fingerprint size={19} /> OFFICIAL DISTRACTION REPORT
            </span>
            <span>CASE #{arrests.toString().padStart(4, "0")}</span>
          </div>
          <div className="case-caption">
            <span>
              THE INTERNET <small>VS.</small>
            </span>
            <h2>{setup.name.toUpperCase()}</h2>
            <span className="guilty-stamp">GUILTY</span>
          </div>
          <div className="case-detail">
            <span className="field-label">THE CHARGE</span>
            <h3>{analysis.offense}</h3>
            <span className="field-label">
              THE EVIDENCE {setup.mode === "demo" && "· SCRIPTED"}
            </span>
            <p>{analysis.evidence}</p>
          </div>
          <div className="sentence">
            <span>SENTENCE</span>
            <strong>
              {analysis.sentenceMinutes}
              <small>
                MINUTES OF
                <br />
                PRODUCTIVE WORK
              </small>
            </strong>
            <span className="sentence-note">
              A recommendation. Your browser is not locked.
            </span>
          </div>
          <div className="roast">
            <span className="field-label">OFFICER’S COMMENT</span>
            <p>“{analysis.roast}”</p>
          </div>
          <button
            data-dialog-initial
            className="button-primary dismiss-button"
            onClick={dismiss}
          >
            DISTRACTION DISMISSED <ArrowRight size={18} />
          </button>
          <button className="busted-stop" onClick={stop}>
            <Square size={11} /> End patrol & close case
          </button>
        </motion.section>
        <span className="busted-footer">
          {setup.mode === "demo"
            ? "REHEARSAL MODE · THIS CASE IS SCRIPTED"
            : `${Math.round(analysis.confidence * 100)}% CONFIDENCE · CAUGHT BY GEMINI VISION`}
        </span>
      </div>
    </motion.div>
  );
}
