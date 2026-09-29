import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await mkdir("artifacts", { recursive: true });
const results = [];
try {
  for (const scene of [
    {
      name: "productive",
      title: "SQL Window Functions Tutorial",
      subtitle: "Assignment: learn SQL window functions",
      body: "SELECT department, salary,\n       RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank\nFROM employees;",
      goal: "Complete my SQL window functions assignment",
    },
    {
      name: "distracting",
      title: "Cristiano Ronaldo Funny Moments Compilation",
      subtitle: "Entertainment · Football highlights · Recommended videos",
      body: "RONALDO IMPOSSIBLE SKILLS 4K\nFunniest football moments — 15 minutes\nUp next: Celebrity fails compilation",
      goal: "Complete my SQL window functions assignment",
    },
  ]) {
    await page.setContent(
      `<html><body style="background:#101621;color:#f0f4ff;font:24px sans-serif;padding:55px"><header style="color:#ff566b">YouTube · SAMPLE TEST SCENE</header><h1>${scene.title}</h1><p>${scene.subtitle}</p><pre style="font-size:20px;line-height:2;padding:30px;background:#1b2940">${scene.body}</pre></body></html>`,
    );
    const image = await page.screenshot({ type: "jpeg", quality: 70 });
    const response = await fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${image.toString("base64")}`,
        persona: "gen-z",
        goal: scene.goal,
      }),
    });
    const result = await response.json();
    results.push({ scene: scene.name, status: response.status, ...result });
    console.log(JSON.stringify(results.at(-1)));
    if (!response.ok) {
      process.exitCode = 1;
      break;
    }
    if (result.analysis?.classification !== scene.name) process.exitCode = 1;
  }
  await writeFile(
    "artifacts/live-ai-check.json",
    JSON.stringify(results, null, 2),
  );
} finally {
  await browser.close();
}
