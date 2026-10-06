import { expect, type Page, test } from "@playwright/test";
import { programById } from "../src/lib/plumb/catalog";
import { dayKey, seed, stepHeading, STORE_KEY } from "./helpers";

const DAY = new Date("2026-09-25T09:00:00");
const TODAY = dayKey(DAY);
const PROGRAM = programById("morning-plumb")!;
const [FIRST, SECOND] = PROGRAM.steps;

/**
 * Swaps the real speech engine for a recorder. `autoEnd` controls whether utterances finish
 * on their own; off simulates a long cue still being read.
 */
async function stubSpeech(page: Page, { autoEnd }: { autoEnd: boolean }) {
  await page.addInitScript((auto) => {
    const w = window as unknown as { __spoken: string[] };
    w.__spoken = [];
    const stub = {
      speak(u: SpeechSynthesisUtterance) {
        w.__spoken.push(u.text);
        if (auto) setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 20);
      },
      cancel() {},
      getVoices: () => [],
    };
    Object.defineProperty(window, "speechSynthesis", { value: stub, configurable: true });
  }, autoEnd);
}

const spoken = (page: Page) =>
  page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);

async function start(page: Page, voice?: boolean) {
  await page.clock.install({ time: DAY });
  await seed(page, { clearances: [{ date: TODAY, clearance: "clear" }] });
  if (voice) {
    await page.addInitScript((key) => {
      const raw = JSON.parse(localStorage.getItem(key)!);
      raw.state.voice = true;
      localStorage.setItem(key, JSON.stringify(raw));
    }, STORE_KEY);
  }
  await page.goto(`/session/${PROGRAM.id}`);
  await expect(stepHeading(page)).toHaveText(FIRST.name);
}

test("voice is off by default and says nothing", async ({ page }) => {
  await stubSpeech(page, { autoEnd: true });
  await start(page);
  await expect(page.getByRole("button", { name: "Voice coach" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  expect(await spoken(page)).toEqual([]);
});

test("turning voice on reads the cue verbatim and is remembered", async ({ page }) => {
  await stubSpeech(page, { autoEnd: true });
  await start(page);
  await page.getByRole("button", { name: "Voice coach" }).click();
  await expect.poll(() => spoken(page)).toHaveLength(1);
  expect((await spoken(page))[0]).toContain(FIRST.cue);

  const raw = await page.evaluate((k) => localStorage.getItem(k), STORE_KEY);
  expect(JSON.parse(raw!).state.voice).toBe(true);

  await page.getByRole("button", { name: "Skip" }).click();
  await expect(stepHeading(page)).toHaveText(SECOND.name);
  await expect.poll(async () => (await spoken(page)).at(-1)).toContain(SECOND.cue);
});

test("a timed hold waits for its cue, and Start now skips the wait", async ({ page }) => {
  await stubSpeech(page, { autoEnd: false });
  await start(page);
  await page.getByRole("button", { name: "Voice coach" }).click();
  // Moving to a new step is a tap, so the next cue can play. The step is a timed hold.
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Previous exercise" }).click();
  await expect(stepHeading(page)).toHaveText(FIRST.name);
  await expect(page.getByRole("button", { name: "Start now" })).toBeVisible();

  await page.clock.runFor(5000);
  await expect(page.getByText(`0:${FIRST.seconds}`)).toBeVisible();

  await page.getByRole("button", { name: "Start now" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
});

test("a cue that never reports its end still lets the hold start", async ({ page }) => {
  await stubSpeech(page, { autoEnd: false });
  await start(page);
  await page.getByRole("button", { name: "Voice coach" }).click();
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Previous exercise" }).click();
  await expect(page.getByRole("button", { name: "Start now" })).toBeVisible();
  await page.clock.runFor(20_000);
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
});

test("with no tap yet, voice stays quiet and the hold runs as normal", async ({ page }) => {
  await stubSpeech(page, { autoEnd: true });
  // Playwright's navigation counts as a tap, so fake a fresh page with none.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userActivation", {
      value: { hasBeenActive: false, isActive: false },
    });
  });
  await start(page, true);
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  expect(await spoken(page)).toEqual([]);
});
