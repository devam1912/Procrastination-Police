"use client";
import { useRef } from "react";
import { ArrowUpRight, ChevronRight, LockKeyhole, X } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
export function PrivacyDialog({ close }: { close: () => void }) {
  const dialog = useRef<HTMLElement>(null);
  useDialog(dialog, close);
  return (
    <div className="modal-backdrop" onClick={close}>
      <section
        ref={dialog}
        className="privacy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="icon-button modal-close"
          aria-label="Close privacy briefing"
          onClick={close}
        >
          <X />
        </button>
        <LockKeyhole className="blue-text" size={30} />
        <h2 id="privacy-title">Your privacy briefing.</h2>
        <p>
          Only the screen, window or tab you choose is analyzed. Select a single
          tab and close private content before patrol.
        </p>
        <p>
          In live mode, a compressed screenshot is sent to this server and then
          to Google Gemini. We do not intentionally store screenshots or write
          them to logs. Provider processing and retention policies still apply;
          free-tier data may be used to improve Google’s products.
        </p>
        <p>
          Rehearsal mode uses scripted results and sends no screenshots to the
          server. The evidence timeline stays in this tab’s memory and clears
          when you reload or start over.
        </p>
        <p>
          Stop patrol or use the browser’s Stop sharing button to end monitoring
          immediately. An already submitted frame may finish processing at the
          provider.
        </p>
        <a
          href="https://ai.google.dev/gemini-api/terms"
          target="_blank"
          rel="noreferrer"
        >
          Google Gemini API terms <ArrowUpRight size={14} />
        </a>
        <button className="button-primary" data-dialog-initial onClick={close}>
          Understood <ChevronRight size={17} />
        </button>
      </section>
    </div>
  );
}
