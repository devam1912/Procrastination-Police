import { requestSchema } from "../analysis";

export const MAX_BODY_BYTES = 1_450_000;
export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
// Read a bounded stream: Content-Length alone cannot limit a chunked request.
export async function readAnalysisRequest(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new RequestError("Expected JSON evidence.", 415);
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES)
    throw new RequestError("Screenshot is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("Missing evidence.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RequestError("Screenshot is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const combined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(combined));
  } catch {
    throw new RequestError("Invalid JSON evidence.", 400);
  }
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success)
    throw new RequestError("Invalid screenshot, goal or officer.", 400);
  const raw = Buffer.from(parsed.data.image.split(",")[1], "base64");
  if (
    raw.length < 100 ||
    raw[0] !== 0xff ||
    raw[1] !== 0xd8 ||
    raw[raw.length - 2] !== 0xff ||
    raw[raw.length - 1] !== 0xd9
  )
    throw new RequestError("Evidence must be a nonempty JPEG frame.", 400);
  return parsed.data;
}
