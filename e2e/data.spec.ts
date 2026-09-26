import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { daysAgo, SCREENING, seed, sessionLog, stored, streakStat } from "./helpers";

const two = [sessionLog(daysAgo(2)), sessionLog(daysAgo(1))];

function file(content: unknown) {
  return {
    name: "plumb-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(typeof content === "string" ? content : JSON.stringify(content)),
  };
}

test.describe("backup", () => {
  test("download writes a v2 file with the history", async ({ page }) => {
    await seed(page, { logs: two });
    await page.goto("/progress");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download backup" }).click();
    const d = await download;
    expect(d.suggestedFilename()).toMatch(/^plumb-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const backup = JSON.parse(await readFile((await d.path())!, "utf8"));
    expect(backup.version).toBe(2);
    expect(backup.logs).toHaveLength(2);
  });

  test("copy puts the same backup on the clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await seed(page, { logs: two });
    await page.goto("/progress");
    await page.getByRole("button", { name: "Copy backup" }).click();
    await expect(page.getByText("Backup copied.")).toBeVisible();
    const copied = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    expect(copied.version).toBe(2);
    expect(copied.logs).toHaveLength(2);
  });
});

test.describe("restore", () => {
  const incoming = sessionLog("2026-01-01", { id: "from-file" });

  test("a v1 file asks first, changes nothing until confirmed, then replaces", async ({ page }) => {
    await seed(page, { logs: two });
    await page.goto("/progress");
    await page.locator('input[type="file"]').setInputFiles(
      file({ version: 1, exportedAt: "2026-01-02T00:00:00Z", logs: [incoming], checkIns: [], clearance: "clear" }),
    );
    await expect(
      page.getByText("Replace 2 sessions and 0 check-ins with 1 session and 0 check-ins?"),
    ).toBeVisible();
    expect((await stored(page)).logs).toHaveLength(2);

    await page.getByRole("button", { name: "Replace" }).click();
    await expect(page.getByText("Backup restored.")).toBeVisible();
    const after = await stored(page);
    expect(after.logs.map((l) => l.id)).toEqual(["from-file"]);
    expect(after.clearances).toEqual([]);
  });

  test("a v2 file restores its clearances; cancel leaves data alone", async ({ page }) => {
    await seed(page, { logs: two });
    await page.goto("/progress");
    const v2 = {
      version: 2,
      exportedAt: "2026-01-02T00:00:00Z",
      logs: [incoming],
      checkIns: [],
      clearances: [{ date: "2026-01-01", clearance: "cautious" }],
    };
    const input = page.locator('input[type="file"]');

    await input.setInputFiles(file(v2));
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("button", { name: "Replace" })).toHaveCount(0);
    expect((await stored(page)).logs).toHaveLength(2);

    await input.setInputFiles(file(v2));
    await page.getByRole("button", { name: "Replace" }).click();
    await expect(page.getByText("Backup restored.")).toBeVisible();
    expect((await stored(page)).clearances).toEqual(v2.clearances);
  });

  test("a file that isn't a backup is rejected", async ({ page }) => {
    await seed(page, { logs: two });
    await page.goto("/progress");
    const input = page.locator('input[type="file"]');
    for (const bad of ["not json", { version: 9, logs: [], checkIns: [] }]) {
      await input.setInputFiles(file(bad));
      await expect(page.getByText("That file isn't a Plumb backup.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Replace" })).toHaveCount(0);
    }
    expect((await stored(page)).logs).toHaveLength(2);
  });
});

test("state saved by the old v1 app migrates: history kept, clearance asked again", async ({ page }) => {
  await seed(page, { version: 1, logs: [sessionLog(daysAgo(1))], clearance: "clear" });
  await page.goto("/progress");
  expect(await streakStat(page)).toBe("1");
  await page.goto("/session/desk-reset");
  await expect(page.getByRole("heading", { name: SCREENING })).toBeVisible();
});
