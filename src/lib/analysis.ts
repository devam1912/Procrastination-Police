import { z } from "zod";

export const personas = [
  {
    id: "gen-z",
    name: "Gen-Z Cop",
    emoji: "💀",
    role: "Chronically online. Always on duty.",
    sample: "Bro got caught in 4K procrastinating 💀",
    instruction:
      "Use playful internet slang, one short meme-friendly joke. No personal insults.",
  },
  {
    id: "indian-mom",
    name: "Indian Mom",
    emoji: "👩",
    role: "Disappointed, but with love.",
    sample: "You said you were studying. Is this studying?",
    instruction:
      "Sound like a caring, unimpressed mother. No ethnic stereotypes or accent imitation.",
  },
  {
    id: "professor",
    name: "Strict Professor",
    emoji: "👨‍🏫",
    role: "Your excuses are not peer-reviewed.",
    sample: "Ronaldo highlights are not in the syllabus.",
    instruction:
      "Use dry academic wit about the activity, syllabus and methodology.",
  },
  {
    id: "manager",
    name: "Corporate Manager",
    emoji: "💼",
    role: "Let’s circle back to actual work.",
    sample: "We have concerns about your productivity metrics.",
    instruction:
      "Use polite corporate jargon and absurd performance-review humor.",
  },
  {
    id: "terminator",
    name: "Terminator",
    emoji: "🤖",
    role: "Distractions will be terminated.",
    sample: "Distraction identified. Excuse rejected.",
    instruction:
      "Use robotic, short statements about productivity. No threats or violence.",
  },
] as const;
export const personaIds = [
  "gen-z",
  "indian-mom",
  "professor",
  "manager",
  "terminator",
] as const;
export type PersonaId = (typeof personaIds)[number];
export type Mode = "live" | "demo";

export const analysisSchema = z.object({
  activity: z.string().min(1).max(180),
  classification: z.enum([
    "productive",
    "neutral",
    "suspicious",
    "distracting",
  ]),
  confidence: z.number().min(0).max(1),
  productivityScore: z.number().int().min(0).max(100),
  offense: z.string().max(120),
  evidence: z.string().max(400),
  verdict: z.enum(["CLEAR", "UNDER REVIEW", "GUILTY"]),
  sentenceMinutes: z.number().int().min(0).max(60),
  roast: z.string().max(240),
  severity: z.enum(["low", "medium", "high"]),
});
export type Analysis = z.infer<typeof analysisSchema>;
export const analysisJsonSchema = z.toJSONSchema(analysisSchema, {
  target: "draft-7",
});
export const requestSchema = z.object({
  image: z
    .string()
    .max(1_400_000)
    .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/),
  persona: z.enum(personaIds),
  goal: z.string().trim().min(3).max(200),
  accessCode: z.string().max(128).optional(),
});
export type AnalysisRequest = z.infer<typeof requestSchema>;
export const labels: Record<Analysis["classification"], string> = {
  productive: "Civilian currently behaving",
  neutral: "Nothing to report… yet",
  suspicious: "Suspicious activity detected",
  distracting: "Crime against productivity",
};
