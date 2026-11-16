import { expect, test } from "@playwright/test";
import { dayKey, daysAgo, seed, sessionLog, STORE_KEY } from "./helpers";

const map = (page: import("@playwright/test").Page) => page.getByTestId("body-map");

test("an empty history shows an untinted figure", async ({ page }) => {
  await page.goto("/progress");
  await expect(map(page).locator("[data-region=feet]").first()).toBeAttached();
  await expect(map(page).locator("[data-intensity]")).toHaveCount(0);
  await expect(page.getByText("No steps held in the last 7 days.")).toBeVisible();
});

test("a hip session tints the hips, and only inside the window", async ({ page }) => {
  await seed(page, {
    logs: [
      sessionLog(daysAgo(1), { id: "h1", programId: "hip-unstick" }),
      sessionLog(daysAgo(20), { id: "d1", programId: "desk-reset" }),
    ],
  });
  await page.goto("/progress");
  await expect(map(page).locator("[data-region=gluteal][data-intensity='1.00']")).toBeAttached();
  await expect(map(page).locator("[data-region=hip-flexors]")).toBeAttached();
  // desk-reset is 20 days old: outside 7 days, so neck stays idle and its overlay isn't drawn.
  await expect(map(page).locator("[data-region=neck][data-intensity]")).toHaveCount(0);
  await expect(map(page).locator("[data-region=upper-trapezius]")).toHaveCount(0);
  await expect(page.locator("[data-area=hips]")).toHaveText("6");

  await page
    .getByRole("group", { name: "Time window" })
    .getByRole("button", { name: "30 days" })
    .click();
  await expect(map(page).locator("[data-region=neck][data-intensity]").first()).toBeAttached();
  await expect(page.locator("[data-area=neck]")).toHaveText("2");
});

test("a hotspot from a check-in gets a dashed outline", async ({ page }) => {
  await seed(page, {
    logs: [sessionLog(dayKey(new Date()), { programId: "desk-reset" })],
    checkIns: [{ date: dayKey(new Date()), line: "tight", hotspot: "neck" }],
  });
  await page.goto("/progress");
  await expect(map(page).locator("[data-flagged=neck]").first()).toBeAttached();
  await expect(page.getByText("Flagged tight in a check-in")).toBeVisible();
});

test("the figure defaults to male and the choice sticks", async ({ page }) => {
  await page.goto("/progress");
  const group = page.getByRole("group", { name: "Body figure" });
  await expect(map(page)).toHaveAttribute("data-figure", "male");
  await expect(group.getByRole("button", { name: "Male", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await group.getByRole("button", { name: "Female" }).click();
  await expect(map(page)).toHaveAttribute("data-figure", "female");
  await expect(map(page).locator("[data-region=feet]").first()).toBeAttached();

  await page.reload();
  await expect(map(page)).toHaveAttribute("data-figure", "female");
  const state = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) ?? "{}").state,
    STORE_KEY,
  );
  expect(state.figure).toBe("female");
});

test("the figure preference stays out of backups", async ({ page }) => {
  await page.goto("/progress");
  await page
    .getByRole("group", { name: "Body figure" })
    .getByRole("button", { name: "Female" })
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup" }).click();
  const path = await (await download).path();
  const { readFile } = await import("node:fs/promises");
  const backup = JSON.parse(await readFile(path!, "utf8"));
  expect(backup).not.toHaveProperty("figure");
});

test("the figure's licence ships with the site and is linked", async ({ page, request }) => {
  await page.goto("/progress");
  const link = page.getByRole("link", { name: "MuscleMap by Melih Colpan (MIT)" });
  await expect(link).toHaveAttribute("href", "/third-party-notices.txt");
  const res = await request.get("/third-party-notices.txt");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain("Copyright (c) 2026 Melih Colpan");
  expect(text).toContain("Permission is hereby granted");
});

test("a figure that fails to load says so instead of spinning", async ({ page }) => {
  await page.route(/paths-male-[^/]*\.js$/, (route) => route.abort());
  await page.goto("/progress");
  await expect(page.getByTestId("body-map-error")).toHaveText(
    "Couldn't load the body figure. Reload the page to try again.",
  );
});
