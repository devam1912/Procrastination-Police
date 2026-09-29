"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  analysisSchema,
  type Analysis,
  type Mode,
  type PersonaId,
} from "@/lib/analysis";
import { demoAnalysis } from "@/lib/demo";
import {
  closeSession,
  newSession,
  recordAnalysis,
  shouldArrest,
  type Session,
} from "@/lib/session";
import { PoliceAudio } from "@/lib/audio";

export interface PatrolSetup {
  persona: PersonaId;
  goal: string;
  name: string;
  mode: Mode;
  accessCode: string;
}
export function usePatrol(videoRef: RefObject<HTMLVideoElement | null>) {
  const [phase, setPhase] = useState<"idle" | "starting" | "active" | "closed">(
    "idle",
  );
  const [session, setSession] = useState<Session | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [setup, setSetup] = useState<PatrolSetup | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [bust, setBust] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [now, setNow] = useState(0);
  const runtime = useRef({
    generation: 0,
    active: false,
    busy: false,
    demoIndex: 0,
    lastArrest: 0,
    bust: false,
    paused: false,
  });
  const sessionRef = useRef<Session | null>(null);
  const setupRef = useRef<PatrolSetup | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const audio = useRef<PoliceAudio | null>(null);
  const volumeRef = useRef(volume);
  const scanRef = useRef<() => Promise<void>>(async () => {});

  const cleanup = useCallback(() => {
    runtime.current.generation++;
    runtime.current.active = false;
    runtime.current.busy = false;
    if (timer.current) clearTimeout(timer.current);
    controller.current?.abort();
    audio.current?.stop();
    streamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [videoRef]);

  const stop = useCallback(() => {
    cleanup();
    setStream(null);
    setScanning(false);
    setBust(null);
    setError(null);
    const s = sessionRef.current;
    if (s) {
      const ended = closeSession(s, Date.now());
      sessionRef.current = ended;
      setSession(ended);
      setPhase("closed");
    } else setPhase("idle");
  }, [cleanup]);

  const schedule = useCallback((delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void scanRef.current();
    }, delay);
  }, []);

  const scan = useCallback(async () => {
    const rt = runtime.current;
    const config = setupRef.current;
    const video = videoRef.current;
    if (!rt.active || rt.busy || rt.bust || rt.paused || !config || !video)
      return;
    const generation = rt.generation;
    rt.busy = true;
    setScanning(true);
    controller.current = new AbortController();
    try {
      if (!video.videoWidth || !video.videoHeight || video.readyState < 2)
        throw new Error(
          "The shared screen has no usable frame yet. Keep the source visible and retry.",
        );
      const canvas = document.createElement("canvas");
      const scale = Math.min(
        1,
        1280 / Math.max(video.videoWidth, video.videoHeight),
      );
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx)
        throw new Error(
          "This browser could not capture evidence. Try desktop Chrome or Edge.",
        );
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      let result: Analysis;
      if (config.mode === "demo") {
        result = demoAnalysis(rt.demoIndex++, config.persona);
      } else {
        const image = canvas.toDataURL("image/jpeg", 0.68);
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image,
            goal: config.goal,
            persona: config.persona,
            accessCode: config.accessCode,
          }),
          signal: AbortSignal.any([
            controller.current.signal,
            AbortSignal.timeout(29_000),
          ]),
        });
        let body: {
          analysis?: unknown;
          source?: string;
          error?: string;
        };
        try {
          body = await response.json();
        } catch {
          throw new Error(
            "Dispatch returned unreadable evidence. No arrest was made. Retry analysis.",
          );
        }
        if (!response.ok)
          throw new Error(
            body.error || "Dispatch is unavailable. Retry analysis.",
          );
        if (body.source !== "live")
          throw new Error("Unrecognized analysis source. No arrest was made.");
        const parsed = analysisSchema.safeParse(body.analysis);
        if (!parsed.success)
          throw new Error(
            "Dispatch returned invalid evidence. No arrest was made. Retry analysis.",
          );
        result = parsed.data;
      }
      if (generation !== runtime.current.generation || !runtime.current.active)
        return;
      const timestamp = Date.now();
      const arrest =
        shouldArrest(result) && timestamp - rt.lastArrest >= 30_000;
      const updated = recordAnalysis(
        sessionRef.current!,
        result,
        timestamp,
        arrest,
      );
      sessionRef.current = updated;
      setSession(updated);
      setAnalysis(result);
      setNow(timestamp);
      if (arrest) {
        rt.lastArrest = timestamp;
        rt.bust = true;
        setBust(result);
        audio.current?.siren(volumeRef.current);
      } else schedule(config.mode === "demo" ? 4_500 : 12_000);
    } catch (err) {
      if (generation !== runtime.current.generation || !runtime.current.active)
        return;
      rt.paused = true;
      setError(
        err instanceof Error && err.name !== "TimeoutError"
          ? err.message
          : "Analysis timed out. Retry when your connection is ready.",
      );
      // Unverified time must not count toward a clean streak.
      if (sessionRef.current) {
        const endedStreak = closeSession(sessionRef.current, Date.now());
        sessionRef.current = { ...endedStreak, endedAt: null };
        setSession(sessionRef.current);
      }
    } finally {
      if (generation === runtime.current.generation) {
        rt.busy = false;
        setScanning(false);
      }
    }
  }, [schedule, videoRef]);

  useEffect(() => {
    scanRef.current = scan;
  }, [scan]);
  useEffect(() => {
    if (phase !== "active") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [phase]);
  useEffect(
    () => () => {
      cleanup();
      audio.current?.dispose();
    },
    [cleanup],
  );

  const start = useCallback(
    async (config: PatrolSetup) => {
      if (runtime.current.active) return;
      setError(null);
      if (!navigator.mediaDevices?.getDisplayMedia || !window.isSecureContext) {
        setError(
          "Screen sharing needs desktop Chrome or Edge on localhost or HTTPS. Mobile browsers may not support it.",
        );
        return;
      }
      cleanup();
      const generation = runtime.current.generation;
      setPhase("starting");
      audio.current ??= new PoliceAudio();
      void audio.current.unlock();
      let shared: MediaStream | null = null;
      try {
        // Called directly from the click: screen sharing requires user activation.
        shared = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 5 },
          audio: false,
        });
        if (generation !== runtime.current.generation) {
          shared.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = shared;
        const track = shared.getVideoTracks()[0];
        if (!track)
          throw new Error("No screen was selected. Please try again.");
        track.onended = stop;
        const video = videoRef.current;
        if (!video)
          throw new Error(
            "Screen preview could not start. Reload and try again.",
          );
        video.srcObject = shared;
        await Promise.race([
          video.play(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error("Screen preview timed out. Please try again."),
                ),
              10_000,
            ),
          ),
        ]);
        if (
          generation !== runtime.current.generation ||
          track.readyState === "ended"
        )
          return;
        runtime.current = {
          generation,
          active: true,
          busy: false,
          demoIndex: 0,
          lastArrest: 0,
          bust: false,
          paused: false,
        };
        setupRef.current = config;
        setSetup(config);
        const s = newSession();
        sessionRef.current = s;
        setSession(s);
        setAnalysis(null);
        setBust(null);
        setStream(shared);
        setNow(Date.now());
        setPhase("active");
        schedule(1500);
      } catch (err) {
        if (generation !== runtime.current.generation) return;
        shared?.getTracks().forEach((t) => t.stop());
        cleanup();
        setStream(null);
        setPhase("idle");
        const denied =
          err instanceof DOMException &&
          ["NotAllowedError", "AbortError"].includes(err.name);
        setError(
          denied
            ? "Screen permission was canceled. No screen is being monitored. Start patrol when you’re ready."
            : err instanceof Error
              ? err.message
              : "Screen sharing failed. Please try again.",
        );
      }
    },
    [cleanup, schedule, stop, videoRef],
  );

  const dismiss = useCallback(() => {
    runtime.current.bust = false;
    setBust(null);
    audio.current?.stop();
    schedule(12_000);
  }, [schedule]);
  const retry = useCallback(() => {
    setError(null);
    runtime.current.paused = false;
    void scanRef.current();
  }, []);
  const setSound = useCallback((value: number) => {
    volumeRef.current = value;
    setVolume(value);
    audio.current?.setVolume(value);
  }, []);
  const reset = useCallback(() => {
    cleanup();
    sessionRef.current = null;
    setSession(null);
    setSetup(null);
    setPhase("idle");
    setError(null);
  }, [cleanup]);
  return {
    phase,
    session,
    stream,
    setup,
    analysis,
    bust,
    error,
    scanning,
    volume,
    now,
    start,
    stop,
    dismiss,
    retry,
    setSound,
    reset,
  };
}
export type Patrol = ReturnType<typeof usePatrol>;
