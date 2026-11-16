import { expect, test } from "@playwright/test";
import { daysAgo, dayKey, seed, sessionLog, stepHeading } from "./helpers";

const status = (page: import("@playwright/test").Page) => page.getByTestId("backup-status");

test("the backup section says when the last backup was", async ({ page }) => {
  await seed(page, { logs: [sessionLog(daysAgo(1))] });
  await page.goto("/progress");
  await expect(status(page)).toContainText("Last backup: never.");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup" }).click();
  await download;
  await expect(status(page)).not.toContainText("never");
});

/** Holds one rep step of Desk Reset and skips the rest: a held session. */
async function holdDeskReset(page: import("@playwright/test").Page, oldSessions: number) {
  const today = dayKey(new Date());
  const logs = Array.from({ length: oldSessions }, (_, i) =>
    sessionLog(daysAgo(i + 1), { id: `old-${i}`, at: i + 1 }),
  );
  await seed(page, { logs, clearances: [{ date: today, clearance: "clear" }] });
  await page.goto("/session/desk-reset");
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(stepHeading(page)).toHaveText("Drawer chin");
  await page.getByRole("button", { name: /reps/ }).click();
  await page.getByRole("button", { name: "Next" }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("heading", { name: "The line held." })).toBeVisible();
}

const reminder = (page: import("@playwright/test").Page) =>
  page.getByRole("link", { name: /sessions since your last backup/ });

test("after ten sessions without a backup, the finish screen asks for one", async ({ page }) => {
  await holdDeskReset(page, 9);
  await expect(reminder(page)).toHaveText("10 sessions since your last backup. Back up now");
  await expect(reminder(page)).toHaveAttribute("href", "/progress");
});

test("before ten, the finish screen doesn't nag", async ({ page }) => {
  await holdDeskReset(page, 8);
  await expect(reminder(page)).toHaveCount(0);
});
