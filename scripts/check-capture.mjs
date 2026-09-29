import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  channel: "chrome",
  args: [
    "--auto-select-tab-capture-source-by-title=Patrol capture verification",
    "--enable-usermedia-screen-capturing",
    "--allow-http-screen-capture",
  ],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
});
const source = await context.newPage();
const app = await context.newPage();
const errors = [];
app.on("pageerror", (err) => errors.push(err.message));
app.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
await mkdir("artifacts", { recursive: true });
function scene(title, body) {
  return `<html><head><title>Patrol capture verification</title></head><body style="background:#101621;color:#f0f4ff;font:24px sans-serif;padding:45px"><header style="color:#ff566b">YouTube · CAPTURE VERIFICATION SCENE</header><h1>${title}</h1><pre style="font-size:22px;line-height:2;padding:30px;background:#1b2940">${body}</pre></body></html>`;
}
try {
  await source.setContent(
    scene(
      "SQL Window Functions Tutorial",
      "Assignment: learn SQL window functions\nSELECT RANK() OVER (ORDER BY salary DESC)\nFROM employees;",
    ),
  );
  await app.goto("http://localhost:3000");
  await app
    .getByLabel("WHAT SHOULD YOU BE DOING?")
    .fill("Complete my SQL window functions assignment");
  await app.getByRole("button", { name: "START PATROL", exact: true }).click();
  await app
    .getByRole("heading", { name: "Patrol active." })
    .waitFor({ timeout: 20_000 });
  await source.bringToFront();
  await app
    .getByRole("heading", { name: "Civilian currently behaving" })
    .waitFor({ timeout: 35_000 });
  await app.screenshot({ path: "artifacts/real-capture-productive.png" });
  await source.setContent(
    scene(
      "Cristiano Ronaldo Funny Moments Compilation",
      "RONALDO IMPOSSIBLE SKILLS 4K\nEntertainment · Football highlights\nUp next: celebrity fails compilation",
    ),
  );
  await source.bringToFront();
  await app
    .getByRole("dialog", { name: "BUSTED!" })
    .waitFor({ timeout: 40_000 });
  await app.waitForTimeout(1000);
  await app.screenshot({ path: "artifacts/real-capture-busted.png" });
  await app.getByRole("button", { name: /End patrol/ }).click();
  await app.getByRole("heading", { name: "CASE CLOSED." }).waitFor();
  const result = {
    realGetDisplayMedia: true,
    realGemini: true,
    productive: true,
    distracting: true,
    summary: true,
    consoleErrors: errors,
  };
  await writeFile(
    "artifacts/real-capture-check.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
