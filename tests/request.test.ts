import { describe, expect, it } from "vitest";
import { MAX_BODY_BYTES, readAnalysisRequest } from "../src/lib/server/request";
const jpeg = Buffer.concat([
  Buffer.from([0xff, 0xd8]),
  Buffer.alloc(100),
  Buffer.from([0xff, 0xd9]),
]);
const payload = {
  image: `data:image/jpeg;base64,${jpeg.toString("base64")}`,
  persona: "gen-z",
  goal: "Write code",
};
function req(body: unknown, contentType = "application/json") {
  return new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "content-type": contentType },
    body: JSON.stringify(body),
  });
}
describe("bounded evidence requests", () => {
  it("accepts JPEG evidence and valid contextual goal", async () => {
    expect((await readAnalysisRequest(req(payload))).goal).toBe("Write code");
  });
  it("rejects external image URLs and empty frames", async () => {
    await expect(
      readAnalysisRequest(
        req({ ...payload, image: "https://example.com/a.jpg" }),
      ),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      readAnalysisRequest(
        req({ ...payload, image: "data:image/jpeg;base64,YQ==" }),
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("rejects bad personas, invalid JSON and wrong content type", async () => {
    await expect(
      readAnalysisRequest(req({ ...payload, persona: "other" })),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      readAnalysisRequest(req(payload, "text/plain")),
    ).rejects.toMatchObject({ status: 415 });
    await expect(
      readAnalysisRequest(
        new Request("http://localhost", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("limits chunked requests even without Content-Length", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_BODY_BYTES + 1));
        controller.close();
      },
    });
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      duplex: "half",
    } as RequestInit);
    await expect(readAnalysisRequest(request)).rejects.toMatchObject({
      status: 413,
    });
  });
});
