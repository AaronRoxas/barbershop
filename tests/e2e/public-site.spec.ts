import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Run against the locally seeded reference shop and the current production build.
const pages = [
  { path: "/", heading: /A good cut\.\s*A better day\./ },
  { path: "/services", heading: "A cut above the everyday." },
  { path: "/about", heading: "A familiar kind of feeling." },
  { path: "/barbers", heading: "Good people. Great cuts." },
  { path: "/contact", heading: "Your chair is waiting." },
];

for (const route of pages) {
  test(`${route.path} renders, fits the viewport, and passes accessibility checks`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.heading);
    await expect(page.locator("main")).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) }))).toEqual([]);
    expect(errors).toEqual([]);
    if (route.path === "/") {
      const image = page.locator(".hero-visual img");
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await page.screenshot({ path: testInfo.outputPath("homepage.png"), fullPage: true });
    }
  });
}

test("services use the database menu and preserve the booking selection", async ({ page }) => {
  await page.goto("/services");
  for (const name of ["Classic Haircut", "Beard Grooming", "Colors and Treatment", "Kid’s Haircut", "Haircut Consultation"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Skin Fade", exact: true })).toHaveCount(0);
  const row = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Colors and Treatment", exact: true }) });
  await expect(row).toContainText("120 minutes");
  await expect(row).toContainText("₱1,200");
  await row.getByRole("link", { name: "Book Colors and Treatment", exact: true }).click();
  await expect(page).toHaveURL(/\/book\?service=/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Make time for yourself.");
  await expect(page.getByRole("radio", { name: /Colors and Treatment/ })).toBeChecked();
  await expect(page.getByText(/reserved only after/)).toBeVisible();
});

test("barber selection and working hours remain distinct from appointment availability", async ({ page }) => {
  await page.goto("/barbers");
  const profile = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Alex", exact: true }) });
  await expect(profile).toContainText("Classic Haircut");
  await profile.locator("summary").click();
  await expect(profile).toContainText("Asia/Manila");
  await profile.getByRole("link", { name: "Book with Alex" }).click();
  await expect(page).toHaveURL(/\/book\?barber=/);
  await page.getByRole("radio", { name: /Classic Haircut/ }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Alex", exact: true })).toBeChecked();
});

test("navigation supports mobile interaction and keyboard access", async ({ page, isMobile }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  if (isMobile) {
    const menu = page.locator(".menu-toggle");
    await expect(nav).toBeHidden();
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
  } else {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  }
  await nav.getByRole("link", { name: "Services", exact: true }).click();
  await expect(page).toHaveURL(/\/services$/);
  if (isMobile) {
    await expect(nav).toBeHidden();
    await page.getByRole("button", { name: /Menu/ }).click();
  }
  await expect(nav.getByRole("link", { name: "Services", exact: true })).toHaveAttribute("aria-current", "page");
});

test("public pages reflow at 320px and tablet widths", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Responsive edge widths are checked by the mobile project.");
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of pages) {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.heading);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${route.path} at ${width}px`).toBe(true);
    }
  }
});

test("missing contact and review data are honest, and the demo is not indexed", async ({ page, request }) => {
  await page.goto("/contact");
  await expect(page.getByText("Our address will be shared soon.")).toBeVisible();
  await expect(page.getByText("Contact details coming soon.")).toBeVisible();
  await expect(page.getByText(/All times are in Asia\/Manila/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Get directions" })).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.goto("/");
  await expect(page.getByText(/Customer reviews will be shared here/)).toBeVisible();
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("<loc>");
});

test("unknown booking identifiers and unknown pages do not leak data", async ({ page }) => {
  await page.goto("/book?service=invalid&barber=invalid");
  await expect(page.locator('input[name="service"]:checked')).toHaveCount(0);
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A little off the beaten path.");
});
