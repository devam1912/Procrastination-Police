export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ configured: Boolean(process.env.GEMINI_API_KEY), accessCodeRequired: Boolean(process.env.PATROL_ACCESS_CODE), model: process.env.GEMINI_MODEL || "gemini-3.8-flash" }, { headers: { "Cache-Control": "no-store" } });
}
