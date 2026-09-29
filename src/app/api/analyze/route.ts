import { timingSafeEqual } from "node:crypto";
import { analyzeScreen, ProviderError } from "@/lib/server/provider";
import { readAnalysisRequest, RequestError } from "@/lib/server/request";

export const runtime = "nodejs";
export const maxDuration = 30;
const headers = { "Cache-Control": "no-store" };
// Per-process capacity guard. Use a shared limiter for a larger deployment.
let inflight = 0;
let windowStart = Date.now();
let requests = 0;

export async function POST(request: Request) {
  let acquired = false;
  try {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin)
      throw new RequestError(
        "Evidence must be submitted from this website.",
        403,
      );
    if (!process.env.GEMINI_API_KEY)
      throw new ProviderError(
        "Add GEMINI_API_KEY to .env and restart for real AI, or choose rehearsal mode.",
        503,
      );
    const input = await readAnalysisRequest(request);
    const code = process.env.PATROL_ACCESS_CODE;
    if (code) {
      const expected = Buffer.from(code);
      const supplied = Buffer.from(input.accessCode ?? "");
      if (
        expected.length !== supplied.length ||
        !timingSafeEqual(expected, supplied)
      )
        throw new RequestError(
          "Enter the correct patrol access code in setup.",
          401,
        );
    }
    if (Date.now() - windowStart > 60_000) {
      windowStart = Date.now();
      requests = 0;
    }
    if (inflight >= 3 || requests >= 24)
      return Response.json(
        { error: "Dispatch is busy. Try again in a minute." },
        { status: 429, headers: { ...headers, "Retry-After": "60" } },
      );
    inflight++;
    requests++;
    acquired = true;
    const analysis = await analyzeScreen(input, request.signal);
    return Response.json({ analysis, source: "live" }, { headers });
  } catch (error) {
    const known =
      error instanceof RequestError || error instanceof ProviderError;
    return Response.json(
      {
        error: known
          ? error.message
          : "Dispatch could not process this frame. Please retry.",
      },
      { status: known ? error.status : 500, headers },
    );
  } finally {
    if (acquired) inflight--;
  }
}
