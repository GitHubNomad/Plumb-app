import { expect, test } from "@playwright/test";

test.describe("check-in routing", () => {
  for (const [hotspot, program] of [
    ["Neck", "desk-reset"],
    ["Hips", "hip-unstick"],
    ["Low back / spine", "spine-line"],
  ] as const) {
    test(`${hotspot} points at ${program}`, async ({ page }) => {
      await page.goto("/coach");
      await page.getByRole("button", { name: /Tight/ }).click();
      await page.getByRole("button", { name: hotspot, exact: true }).click();
      await expect(page.locator(`a[href="/session/${program}"]`)).toBeVisible();
      await page.getByRole("link", { name: "Today" }).click();
      await expect(page.locator(`a[href="/session/${program}"]`)).toBeVisible();
    });
  }

  test("tight with no hotspot points at the four-minute line", async ({ page }) => {
    await page.goto("/coach");
    await page.getByRole("button", { name: /Tight/ }).click();
    await expect(page.locator('a[href="/session/four-minute"]')).toBeVisible();
  });
});

test.describe("deep links load directly", () => {
  for (const path of ["/session/spine-line", "/progress", "/library", "/coach"]) {
    test(path, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      // The session screen is full-bleed with no tab bar, so wait on the page's main region.
      await expect(page.getByRole("main")).toBeVisible();
    });
  }
});

test("installable: manifest and icons are served", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  const res = await request.get("/manifest.webmanifest");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/manifest+json");
  const manifest = await res.json();
  expect(manifest).toMatchObject({ name: "Plumb", start_url: "/", display: "standalone" });
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  const touch = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
  for (const src of [...manifest.icons.map((i: { src: string }) => i.src), touch]) {
    const icon = await request.get(src);
    expect(icon.status(), src).toBe(200);
    expect(icon.headers()["content-type"]).toBe("image/png");
  }
});

test("share card points at an absolute image", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /^https:\/\/.+\/og\.jpg$/,
  );
});

test("the hero image reserves its space", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator('img[src="/og.jpg"]');
  await expect(hero).toHaveAttribute("width", "1200");
  await expect(hero).toHaveAttribute("height", "630");
});

test("no page scrolls sideways on a phone", async ({ page }) => {
  for (const path of ["/", "/library", "/progress", "/coach", "/session/morning-plumb"]) {
    await page.goto(path);
    await expect(page.getByRole("main")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
