"use client";
import { AnimatePresence } from "motion/react";
import { useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { usePatrol } from "@/hooks/use-patrol";
import { Brand } from "./brand";
import { Landing } from "./landing";
import { Dashboard } from "./dashboard";
import { Busted } from "./busted";
import { Summary } from "./summary";
export function PatrolApp() {
  const captureRef = useRef<HTMLVideoElement>(null);
  const patrol = usePatrol(captureRef);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <Brand />
        <nav aria-label="Main navigation">
          {patrol.phase === "idle" && (
            <a href="#officers">
              The officers <span>↗</span>
            </a>
          )}
          <div className="sound-controls">
            <button
              className="icon-button"
              aria-label={patrol.volume ? "Mute siren" : "Unmute siren"}
              onClick={() => patrol.setSound(patrol.volume ? 0 : 0.35)}
            >
              {patrol.volume ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
            <input
              type="range"
              aria-label="Siren volume"
              min="0"
              max="1"
              step="0.05"
              value={patrol.volume}
              onChange={(e) => patrol.setSound(Number(e.target.value))}
            />
          </div>
          <span className="header-status">
            <span className="live-dot" /> SYSTEM ONLINE
          </span>
        </nav>
      </header>
      <div id="main-content">
        <video
          ref={captureRef}
          autoPlay
          muted
          playsInline
          className="capture-source"
          aria-hidden="true"
        />
        {patrol.phase === "idle" || patrol.phase === "starting" ? (
          <Landing
            start={patrol.start}
            starting={patrol.phase === "starting"}
            error={patrol.error}
          />
        ) : patrol.phase === "active" ? (
          <Dashboard patrol={patrol} />
        ) : patrol.session && patrol.setup ? (
          <Summary
            session={patrol.session}
            setup={patrol.setup}
            reset={patrol.reset}
          />
        ) : null}
      </div>
      <footer className="site-footer">
        <span>PROCRASTINATION POLICE © 2026</span>
        <span>To protect & serve your deadlines.</span>
        <span>NO EXTENSION. NO EXCUSES.</span>
      </footer>
      <AnimatePresence>
        {patrol.bust && patrol.setup && (
          <Busted
            analysis={patrol.bust}
            setup={patrol.setup}
            arrests={patrol.session?.arrests ?? 1}
            dismiss={patrol.dismiss}
            stop={patrol.stop}
            volume={patrol.volume}
            setSound={patrol.setSound}
          />
        )}
      </AnimatePresence>
    </>
  );
}
