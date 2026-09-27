import { expect, test } from "@playwright/test";
import { PROGRAMS } from "../src/lib/plumb/catalog";
import { dayKey, SCREENING, seed, sessionLog, stepHeading, stored, streakStat } from "./helpers";

const DAY = new Date("2026-09-25T09:00:00");
const TODAY = dayKey(DAY);
const FLAGGED = PROGRAMS.flatMap((p) => p.steps)
  .filter((s) => s.caution)
  .map((s) => s.name);

test.describe("clearance gate", () => {
  test("asks first, remembers the answer for today, asks again tomorrow", async ({ page }) => {
    await page.clock.install({ time: DAY });
    await page.goto("/session/hip-unstick");
    await expect(page.getByRole("heading", { name: SCREENING })).toBeVisible();
    await page.getByRole("button", { name: "No — I'm clear" }).click();
    await expect(stepHeading(page)).toHaveText("Figure-four rock");
    await expect(page.getByText(/Adjusted for caution/)).toHaveCount(0);
    expect((await stored(page)).clearances).toEqual([{ date: TODAY, clearance: "clear" }]);

    await page.reload();
    await expect(stepHeading(page)).toHaveText("Figure-four rock");
    await expect(page.getByRole("heading", { name: SCREENING })).toHaveCount(0);

    await page.clock.setSystemTime(new Date("2026-09-26T09:00:00"));
    await page.reload();
    await expect(page.getByRole("heading", { name: SCREENING })).toBeVisible();
  });

  test("the cautious answer adapts the session", async ({ page }) => {
    await page.goto("/session/spine-line");
    await page.getByRole("button", { name: "Yes — I'll skip anything that hurts" }).click();
    await expect(page.getByText("Adjusted for caution — 2 steps replaced with gentler ones")).toBeVisible();
    await expect(stepHeading(page)).not.toHaveText("Ragdoll hang");
  });
});

test.describe("cautious sessions never present a flagged step", () => {
  for (const program of PROGRAMS) {
    test(program.id, async ({ page }) => {
      await page.clock.install({ time: DAY });
      await seed(page, { clearances: [{ date: TODAY, clearance: "cautious" }] });
      await page.goto(`/session/${program.id}`);
      await expect(page.getByText(/Adjusted for caution/)).toBeVisible();

      const seen: string[] = [];
      for (let i = 0; i < program.steps.length; i++) {
        await expect(page.getByText(`${i + 1} / ${program.steps.length}`)).toBeVisible();
        const name = (await stepHeading(page).textContent())!;
        expect(FLAGGED).not.toContain(name);
        seen.push(name);
        await page.getByRole("button", { name: "Skip" }).click();
      }
      expect(new Set(seen).size).toBe(program.steps.length);
      // Skipping everything is not a session and writes nothing.
      await expect(page.getByRole("heading", { name: "That's a skip, not a session." })).toBeVisible();
      expect((await stored(page)).logs).toEqual([]);
    });
  }
});

test("timer counts from the clock, pauses, resumes, and announces completion", async ({ page }) => {
  await page.clock.install({ time: DAY });
  await seed(page, { clearances: [{ date: TODAY, clearance: "clear" }] });
  await page.goto("/session/four-minute");
  await expect(stepHeading(page)).toHaveText("Drop the bob");
  const live = page.locator('[aria-live="polite"]');
  await expect(live).toHaveText("Drop the bob");
  await expect(page.getByText("0:25")).toBeVisible();

  await page.clock.runFor(10_000);
  await expect(page.getByText("0:15")).toBeVisible();

  await page.getByRole("button", { name: "Pause" }).click();
  await page.clock.runFor(20_000);
  await expect(page.getByText("0:15")).toBeVisible();

  await page.getByRole("button", { name: "Resume" }).click();
  await page.clock.runFor(15_000);
  await expect(page.getByText("Held")).toBeVisible();
  await expect(live).toHaveText("Hold complete");
  await expect(page.getByRole("button", { name: "Skip" })).toHaveCount(0);

  await page.getByRole("button", { name: "Next" }).click();
  await expect(stepHeading(page)).toHaveText("Six chins");
  await expect(live).toHaveText("Six chins");
});

test("one held step counts; the skips are recorded", async ({ page }) => {
  await page.clock.install({ time: DAY });
  await seed(page, { clearances: [{ date: TODAY, clearance: "clear" }] });
  await page.goto("/session/desk-reset");
  await page.getByRole("button", { name: "Skip" }).click(); // Seat reset (hold)
  await expect(stepHeading(page)).toHaveText("Drawer chin");
  await page.getByRole("button", { name: /reps/ }).click();
  await page.getByRole("button", { name: "Next" }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Skip" }).click();

  await expect(page.getByRole("heading", { name: "The line held." })).toBeVisible();
  await expect(page.getByText("Desk Reset is done, 4 steps skipped. Streak is 1 day.")).toBeVisible();
  const [entry] = (await stored(page)).logs;
  expect(entry).toMatchObject({ date: TODAY, programId: "desk-reset", stepCount: 5 });
  expect(entry!.skippedStepIds).toHaveLength(4);
  expect(await streakStat(page)).toBe("1");
});

test.describe("streak across days", () => {
  async function holdOneStep(page: import("@playwright/test").Page) {
    await page.goto("/session/desk-reset");
    await page.getByRole("button", { name: "Skip" }).click();
    await page.getByRole("button", { name: /reps/ }).click();
    await page.getByRole("button", { name: "Next" }).click();
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Skip" }).click();
  }

  test("yesterday plus today is two", async ({ page }) => {
    await page.clock.install({ time: DAY });
    await seed(page, {
      logs: [sessionLog("2026-09-24")],
      clearances: [{ date: TODAY, clearance: "clear" }],
    });
    await holdOneStep(page);
    await expect(page.getByText(/Streak is 2 days\./)).toBeVisible();
  });

  test("a gap day resets it", async ({ page }) => {
    await page.clock.install({ time: DAY });
    await seed(page, {
      logs: [sessionLog("2026-09-23")],
      clearances: [{ date: TODAY, clearance: "clear" }],
    });
    await holdOneStep(page);
    await expect(page.getByText(/Streak is 1 day\./)).toBeVisible();
  });

  test("an all-skip day does not keep the streak alive", async ({ page }) => {
    await page.clock.install({ time: DAY });
    await seed(page, {
      logs: [
        sessionLog("2026-09-23"),
        sessionLog("2026-09-24", { stepCount: 5, skippedStepIds: ["a", "b", "c", "d", "e"] }),
      ],
    });
    expect(await streakStat(page)).toBe("0");
  });
});
