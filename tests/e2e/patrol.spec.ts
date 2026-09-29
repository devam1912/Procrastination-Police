import { expect, test, type Page } from "@playwright/test";
import { demoAnalysis } from "../../src/lib/demo";

// Only tests replace the OS picker. The app always calls real getDisplayMedia.
async function mediaFixture(page: Page, denied = false) {
  await page.addInitScript(
    ({ denied }) => {
      Object.defineProperty(navigator.mediaDevices, "getDisplayMedia", {
        configurable: true,
        value: async () => {
          if (denied) throw new DOMException("Denied", "NotAllowedError");
          const canvas = document.createElement("canvas");
          canvas.width = 1280;
          canvas.height = 720;
          const ctx = canvas.getContext("2d")!;
          const draw = () => {
            ctx.fillStyle = "#172235";
            ctx.fillRect(0, 0, 1280, 720);
            ctx.fillStyle = "#a2c2ff";
            ctx.font = "40px monospace";
            ctx.fillText("TEST SCREEN · WRITING AN ASSIGNMENT", 50, 100);
          };
          draw();
          const interval = setInterval(draw, 100);
          const stream = canvas.captureStream(10);
          Object.assign(window, { testScreenStream: stream });
          stream
            .getVideoTracks()[0]
            .addEventListener("ended", () => clearInterval(interval));
          return stream;
        },
      });
    },
    { denied },
  );
}

test("rehearsal goes from actual media pipeline to arrest, dismissal, summary and restart", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  let screenshotPosts = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/analyze")) screenshotPosts++;
  });
  await mediaFixture(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "PROCRASTINATION",
  );
  await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-visual")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "artifacts/landing-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /Rehearsal mode/ }).click();
  await page.getByRole("button", { name: "START PATROL", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Patrol active." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Civilian currently behaving" }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/patrol-active.png",
    fullPage: true,
  });
  await expect(page.getByRole("dialog", { name: "BUSTED!" })).toBeVisible({
    timeout: 25_000,
  });
  await expect(page.getByRole("dialog")).toContainText(
    "Aggravated Procrastination",
  );
  await page.screenshot({
    path: "artifacts/busted-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mute siren" })
    .click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Unmute siren" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "DISTRACTION DISMISSED" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("log")).toContainText("BUSTED");
  await page.getByRole("button", { name: "Stop patrol", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "CASE CLOSED." }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/case-closed.png", fullPage: true });
  await page.getByRole("button", { name: "START NEW PATROL" }).click();
  await expect(
    page.getByRole("button", { name: "START PATROL", exact: true }),
  ).toBeVisible();
  expect(screenshotPosts).toBe(0);
  expect(errors).toEqual([]);
});
test("permission denial is actionable and leaves no patrol running", async ({
  page,
}) => {
  await mediaFixture(page, true);
  await page.goto("/");
  await page.getByRole("button", { name: "START PATROL", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "permission was canceled" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "START PATROL", exact: true }),
  ).toBeEnabled();
});
test("live errors pause polling and retry accepts validated evidence", async ({
  page,
}) => {
  await mediaFixture(page);
  let calls = 0;
  await page.route("**/api/analyze", (route) => {
    calls++;
    if (calls === 1)
      return route.fulfill({
        status: 429,
        json: { error: "Gemini quota reached. Retry in a minute." },
      });
    return route.fulfill({
      json: { analysis: demoAnalysis(0, "gen-z"), source: "live" },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "START PATROL", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Gemini quota reached" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry analysis" }).click();
  await expect(
    page.getByRole("heading", { name: "Civilian currently behaving" }),
  ).toBeVisible();
  await page.evaluate(() => {
    const stream = (window as unknown as { testScreenStream: MediaStream })
      .testScreenStream;
    const track = stream.getVideoTracks()[0];
    track.stop();
    track.dispatchEvent(new Event("ended"));
  });
  await expect(
    page.getByRole("heading", { name: "CASE CLOSED." }),
  ).toBeVisible();
  expect(calls).toBe(2);
});
test("late analysis cannot revive a stopped patrol", async ({ page }) => {
  await mediaFixture(page);
  await page.route("**/api/analyze", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route
      .fulfill({ json: { analysis: demoAnalysis(3, "gen-z"), source: "live" } })
      .catch(() => {});
  });
  await page.goto("/");
  const pendingRequest = page.waitForRequest("**/api/analyze");
  await page.getByRole("button", { name: "START PATROL", exact: true }).click();
  await pendingRequest;
  await page.getByRole("button", { name: "Stop patrol", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "CASE CLOSED." }),
  ).toBeVisible();
  await page.waitForTimeout(1800);
  await expect(
    page.getByRole("heading", { name: "CASE CLOSED." }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("mobile landing and privacy briefing fit without horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".hero-visual")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "artifacts/landing-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /Privacy briefing/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Google Gemini");
  await expect(page.getByRole("button", { name: "Understood" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: /Privacy briefing/ }),
  ).toBeFocused();
});

test("unsupported capture browsers get clear recovery instructions", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator.mediaDevices, "getDisplayMedia", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "START PATROL", exact: true }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Screen sharing needs desktop Chrome" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "START PATROL", exact: true }),
  ).toBeEnabled();
});

test("malformed AI output pauses without an arrest or fake verdict", async ({
  page,
}) => {
  await mediaFixture(page);
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      json: {
        source: "live",
        analysis: { classification: "distracting", confidence: 10 },
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "START PATROL", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "invalid evidence" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Stop patrol", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "CASE CLOSED." }),
  ).toBeVisible();
});
