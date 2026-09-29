import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeScreen } from "../src/lib/server/provider";
import { demoAnalysis } from "../src/lib/demo";
const input = {
  image: "data:image/jpeg;base64,aGVsbG8=",
  goal: "Finish my assignment",
  persona: "professor" as const,
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function providerResponse(text: string, reason = "STOP") {
  return Response.json({
    candidates: [{ finishReason: reason, content: { parts: [{ text }] } }],
  });
}
describe("isolated Gemini provider", () => {
  it("sends server-only key, inline image, goal and persona with structured output", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const fetch = vi
      .fn()
      .mockResolvedValue(
        providerResponse(JSON.stringify(demoAnalysis(0, "professor"))),
      );
    vi.stubGlobal("fetch", fetch);
    const result = await analyzeScreen(input);
    expect(result.classification).toBe("productive");
    const [url, options] = fetch.mock.calls[0];
    expect(url).toContain("gemini-3.1-flash-lite:generateContent");
    expect(url).not.toContain("test-key");
    expect(options.headers["x-goog-api-key"]).toBe("test-key");
    const body = JSON.parse(options.body);
    expect(body.systemInstruction.parts[0].text).toContain("Strict Professor");
    expect(body.contents[0].parts[1].inlineData.mimeType).toBe("image/jpeg");
    expect(body.generationConfig.responseMimeType).toBe("application/json");
  });
  it("fails clearly without a key and never substitutes demo results", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await expect(analyzeScreen(input)).rejects.toMatchObject({ status: 503 });
  });
  it("handles quota, timeout, malformed and incomplete responses", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 429 })),
    );
    await expect(analyzeScreen(input)).rejects.toMatchObject({ status: 429 });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    await expect(analyzeScreen(input)).rejects.toMatchObject({ status: 504 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(providerResponse("oops")));
    await expect(analyzeScreen(input)).rejects.toMatchObject({ status: 502 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(providerResponse("{}", "MAX_TOKENS")),
    );
    await expect(analyzeScreen(input)).rejects.toMatchObject({ status: 502 });
  });
  it("removes guilty verdicts for uncertain classifications", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        providerResponse(
          JSON.stringify({
            ...demoAnalysis(3, "professor"),
            confidence: 0.5,
          }),
        ),
      ),
    );
    expect((await analyzeScreen(input)).sentenceMinutes).toBe(0);
  });
});
