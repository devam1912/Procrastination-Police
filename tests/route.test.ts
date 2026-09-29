import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoAnalysis } from "../src/lib/demo";
const { mockAnalyze } = vi.hoisted(() => ({ mockAnalyze: vi.fn() }));
vi.mock("../src/lib/server/provider", () => ({
  analyzeScreen: mockAnalyze,
  ProviderError: class extends Error {
    constructor(
      message: string,
      public status = 502,
    ) {
      super(message);
    }
  },
}));
const jpeg = Buffer.concat([
  Buffer.from([0xff, 0xd8]),
  Buffer.alloc(100),
  Buffer.from([0xff, 0xd9]),
]);
const payload = {
  image: `data:image/jpeg;base64,${jpeg.toString("base64")}`,
  persona: "gen-z",
  goal: "Finish assignment",
};
function request(origin = "http://localhost:3000", extra = {}) {
  return new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ ...payload, ...extra }),
  });
}
beforeEach(() => {
  vi.resetModules();
  mockAnalyze.mockReset().mockResolvedValue(demoAnalysis(0, "gen-z"));
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  vi.stubEnv("PATROL_ACCESS_CODE", "");
});
afterEach(() => vi.unstubAllEnvs());
describe("analysis API guards", () => {
  it("refuses other origins before contacting the provider", async () => {
    const { POST } = await import("../src/app/api/analyze/route");
    expect((await POST(request("https://other.example"))).status).toBe(403);
    expect(mockAnalyze).not.toHaveBeenCalled();
  });
  it("reports missing credentials without leaking secrets", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { POST } = await import("../src/app/api/analyze/route");
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(mockAnalyze).not.toHaveBeenCalled();
  });
  it("checks an optional access code before paid processing", async () => {
    vi.stubEnv("PATROL_ACCESS_CODE", "private-test-code");
    const { POST } = await import("../src/app/api/analyze/route");
    expect((await POST(request())).status).toBe(401);
    expect(mockAnalyze).not.toHaveBeenCalled();
    expect(
      (
        await POST(
          request("http://localhost:3000", { accessCode: "private-test-code" }),
        )
      ).status,
    ).toBe(200);
  });
  it("returns a labeled live result with no-cache headers", async () => {
    const { POST } = await import("../src/app/api/analyze/route");
    const response = await POST(request());
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await response.json()).source).toBe("live");
  });
  it("bounds per-process requests and returns Retry-After", async () => {
    const { POST } = await import("../src/app/api/analyze/route");
    for (let i = 0; i < 24; i++)
      expect((await POST(request())).status).toBe(200);
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(mockAnalyze).toHaveBeenCalledTimes(24);
  });
});
