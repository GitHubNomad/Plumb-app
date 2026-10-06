import { expect, type Page, test } from "@playwright/test";
import { programById } from "../src/lib/plumb/catalog";
import { dayKey, seed, stepHeading, STORE_KEY } from "./helpers";

const DAY = new Date("2026-09-25T09:00:00");
const PROGRAM = programById("morning-plumb")!;
const [FIRST, SECOND] = PROGRAM.steps;

type Probe = { handlers: Record<string, (() => void) | null>; plays: number; title: string };

/** Records Media Session handlers and audio plays instead of touching real media. */
async function stubMedia(page: Page, { refuseFirstPlay = false } = {}) {
  await page.addInitScript((refuse) => {
    const probe: Probe = { handlers: {}, plays: 0, title: "" };
    (window as unknown as { __media: Probe }).__media = probe;
    const ms = {
      playbackState: "none",
      set metadata(m: { title: string } | null) {
        probe.title = m?.title ?? "";
      },
      get metadata() {
        return null;
      },
      setActionHandler(action: string, fn: (() => void) | null) {
        probe.handlers[action] = fn;
      },
    };
    Object.defineProperty(navigator, "mediaSession", { value: ms, configurable: true });
    let refused = !refuse;
    HTMLMediaElement.prototype.play = function () {
      if (!refused) {
        refused = true;
        return Promise.reject(new DOMException("no gesture", "NotAllowedError"));
      }
      probe.plays += 1;
      return Promise.resolve();
    };
  }, refuseFirstPlay);
}

const press = (page: Page, action: string) =>
  page.evaluate((a) => (window as unknown as { __media: Probe }).__media.handlers[a]?.(), action);
const probe = (page: Page) =>
  page.evaluate(() => {
    const p = (window as unknown as { __media: Probe }).__media;
    return {
      actions: Object.keys(p.handlers).filter((k) => p.handlers[k]),
      plays: p.plays,
      title: p.title,
    };
  });

async function start(page: Page, opts?: { refuseFirstPlay?: boolean; earbuds?: boolean }) {
  await page.clock.install({ time: DAY });
  await seed(page, { clearances: [{ date: dayKey(DAY), clearance: "clear" }] });
  if (opts?.earbuds) {
    await page.addInitScript((key) => {
      const raw = JSON.parse(localStorage.getItem(key)!);
      raw.state.earbuds = true;
      localStorage.setItem(key, JSON.stringify(raw));
    }, STORE_KEY);
  }
  await stubMedia(page, opts);
  await page.goto(`/session/${PROGRAM.id}`);
  await expect(stepHeading(page)).toHaveText(FIRST.name);
}

test("off by default: no handlers, no audio", async ({ page }) => {
  await start(page);
  await expect(page.getByRole("button", { name: "Earbud controls" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(await probe(page)).toEqual({ actions: [], plays: 0, title: "" });
});

test("earbud buttons pause, skip, and go back", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "Earbud controls" }).click();
  await expect
    .poll(async () => (await probe(page)).actions.sort())
    .toEqual(["nexttrack", "pause", "play", "previoustrack"]);
  expect((await probe(page)).plays).toBeGreaterThan(0);
  expect((await probe(page)).title).toBe(FIRST.name);

  await press(page, "pause");
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await press(page, "play");
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

  // Mid-hold, next is a skip, same as the screen offers.
  await press(page, "nexttrack");
  await expect(stepHeading(page)).toHaveText(SECOND.name);
  await expect.poll(async () => (await probe(page)).title).toBe(SECOND.name);

  await press(page, "previoustrack");
  await expect(stepHeading(page)).toHaveText(FIRST.name);
});

test("play marks a rep step, then next counts it as done", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "Earbud controls" }).click();
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(stepHeading(page)).toHaveText(SECOND.name);
  await press(page, "play");
  await expect(page.getByText("Marked")).toBeVisible();
  await press(page, "nexttrack");
  await expect(page.getByText(`3 / ${PROGRAM.steps.length}`)).toBeVisible();
});

test("turning it off releases the buttons", async ({ page }) => {
  await start(page);
  const toggle = page.getByRole("button", { name: "Earbud controls" });
  await toggle.click();
  await expect.poll(async () => (await probe(page)).actions.length).toBe(4);
  await toggle.click();
  await expect.poll(async () => (await probe(page)).actions.length).toBe(0);
});

test("remembered on, but refused before a tap: the first tap starts it", async ({ page }) => {
  await start(page, { earbuds: true, refuseFirstPlay: true });
  await expect.poll(async () => (await probe(page)).actions.length).toBe(4);
  expect((await probe(page)).plays).toBe(0);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect.poll(async () => (await probe(page)).plays).toBeGreaterThan(0);
});
