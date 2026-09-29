import type { Analysis, PersonaId } from "./analysis";
import { personas } from "./analysis";

export function demoAnalysis(index: number, persona: PersonaId): Analysis {
  const stage = Math.min(index, 3);
  const base: Analysis = {
    activity: "Writing the assignment in VS Code", classification: "productive", confidence: 0.96,
    productivityScore: 92, offense: "No offense detected", evidence: "Code editor and project files are visible.",
    verdict: "CLEAR", sentenceMinutes: 0, roast: "Carry on, civilian. Suspiciously responsible behavior.", severity: "low",
  };
  if (stage < 2) return { ...base, activity: stage === 1 ? "Reading SQL window functions documentation" : base.activity };
  if (stage === 2) return { ...base, activity: "Browsing sneakers instead of the assignment", classification: "suspicious", confidence: 0.74, productivityScore: 48, offense: "Potential retail detour", evidence: "A shopping page is open. Relevance to the work goal is unclear.", verdict: "UNDER REVIEW", severity: "medium" };
  return { ...base, activity: "Watching Ronaldo highlights on YouTube", classification: "distracting", confidence: 0.97, productivityScore: 18, offense: "Aggravated Procrastination", evidence: "Watching “Ronaldo Impossible Skills 4K” while the assignment waits patiently.", verdict: "GUILTY", sentenceMinutes: 20, severity: "high", roast: persona === "gen-z" ? "You opened VS Code first. That’s premeditated procrastination 💀" : personas.find(p => p.id === persona)!.sample };
}
