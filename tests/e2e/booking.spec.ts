import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient, type WebSocketLikeConstructor } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import WebSocket from "ws";

test("guest booking works with stale-slot recovery and private confirmation", async ({ page, browser }, testInfo) => {
  const api = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  expect(["127.0.0.1", "localhost"]).toContain(new URL(api).hostname);
  const admin = createClient(api, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, realtime: { transport: WebSocket as unknown as WebSocketLikeConstructor } });
  const { data: business } = await admin.from("businesses").select("id").eq("slug", "reference").single();
  expect(business).not.toBeNull();
  const email = `e2e-${randomUUID()}@example.com`;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const accessible = async () => {
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  };
  try {
    if (testInfo.project.name === "mobile") await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/book");
    await page.getByRole("radio", { name: /Classic Haircut/ }).check();
    const service = await page.locator('input[name="service"]:checked').inputValue();
    await accessible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("radio", { name: "Alex", exact: true }).check();
    const responsePromise = page.waitForResponse(/\/api\/booking\/availability/);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    const response = await responsePromise;
    expect(response.headers()["cache-control"]).toBe("no-store");
    const barberId = new URL(response.url()).searchParams.get("barber");
    await page.locator('button[data-date]:enabled').first().click();
    await page.screenshot({ path: testInfo.outputPath("booking-calendar.png"), fullPage: true });
    await accessible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Appointment time" })).toHaveCount(0);
    await page.locator('input[name="period"]:enabled').first().check();
    await page.getByRole("combobox", { name: "Appointment time" }).selectOption({ index: 1 });
    const startsAt = await page.getByRole("combobox", { name: "Appointment time" }).inputValue();
    await page.screenshot({ path: testInfo.outputPath("booking-time.png"), fullPage: true });
    await accessible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("Full name").fill("Browser Test");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Phone", { exact: true }).fill("+639123456789");
    await page.getByLabel("Notes (optional)").fill("Test appointment");
    await accessible();
    await page.getByRole("button", { name: "Review booking" }).click();
    await expect(page.locator(".booking-summary")).toContainText(email);
    await accessible();
    // Another customer wins this slot after it was displayed in the wizard.
    const competitor = await admin.rpc("create_guest_booking", {
      p_business: business!.id, p_service: service, p_barber: barberId, p_starts_at: startsAt,
      p_request: randomUUID(), p_name: "Competitor", p_email: email, p_phone: "+639123456789", p_notes: "",
    });
    expect(competitor.error).toBeNull();
    await page.getByRole("button", { name: "Book appointment", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("no longer available");
    await page.getByRole("button", { name: "Choose another time" }).click();
    await page.locator('button[data-date]:enabled').first().click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.locator('input[name="period"]:enabled').first().check();
    await page.getByRole("combobox", { name: "Appointment time" }).selectOption({ index: 1 });
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue(email);
    await page.getByRole("button", { name: "Review booking" }).click();
    await page.getByRole("button", { name: "Book appointment", exact: true }).click();
    await expect(page).toHaveURL(/\/book\/confirmed\/BRB-[A-F0-9]{32}$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("You’re on the calendar.");
    await expect(page.locator(".booking-summary")).toContainText("Alex");
    await expect(page.locator("main")).not.toContainText(email);
    await accessible();
    await page.screenshot({ path: testInfo.outputPath("booking-confirmation.png"), fullPage: true });
    const confirmedUrl = page.url();
    await page.reload();
    await expect(page.locator(".booking-summary")).toBeVisible();
    const other = await browser.newContext();
    try {
      const stranger = await other.newPage();
      await stranger.goto(confirmedUrl);
      await expect(stranger.locator(".booking-summary")).toHaveCount(0);
      // Knowing the reference cannot forge the server-signed browser capability.
      await other.addCookies([{ name: "booking-confirmation", value: confirmedUrl.split("/").pop()!, url: confirmedUrl }]);
      await stranger.reload();
      await expect(stranger.locator(".booking-summary")).toHaveCount(0);
    } finally { await other.close(); }
    expect(errors).toEqual([]);
  } finally {
    const cleanup = await admin.from("appointments").delete().eq("business_id", business!.id).eq("customer_email", email);
    expect(cleanup.error).toBeNull();
  }
});

test("availability failures are recoverable and bad requests are rejected", async ({ page, request }) => {
  expect((await request.get("/api/booking/availability?service=invalid&date=2026-02-30")).status()).toBe(400);
  await page.route("**/api/booking/availability?*", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Availability temporarily unavailable." }) }));
  await page.goto("/book");
  await page.getByRole("radio", { name: /Classic Haircut/ }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Availability temporarily unavailable.");
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
  await page.unroute("**/api/booking/availability?*");
  await page.getByRole("button", { name: "Refresh availability" }).click();
  await expect(page.locator('button[data-date]:enabled').first()).toBeVisible();
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
});

test("calendar navigation and period dropdowns use shop time and clear stale selections", async ({ page }) => {
  await page.route("**/api/booking/availability?*", async (route) => {
    const date = new URL(route.request().url()).searchParams.get("date")!;
    const slots = ["09:00", "12:00", "17:45", "18:00"].map((time) => {
      const start = new Date(`${date}T${time}:00+08:00`);
      return { date, startsAt: start.toISOString(), endsAt: new Date(start.getTime() + 1800000).toISOString(), barberId: "30000000-0000-0000-0000-000000000001" };
    });
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ slots }) });
  });
  await page.goto("/book");
  await page.getByRole("radio", { name: /Classic Haircut/ }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const month = await page.locator(".calendar-header h3").innerText();
  await expect(page.getByRole("button", { name: "Previous month" })).toBeDisabled();
  await expect(page.locator('button[data-date]:enabled').first()).toBeVisible();
  await page.getByRole("button", { name: "Next month" }).click();
  await expect(page.locator(".calendar-header h3")).not.toHaveText(month);
  await expect(page.locator('button[data-date]:enabled').first()).toBeVisible();
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(page.locator(".calendar-header h3")).toHaveText(month);
  await page.locator('button[data-date]:enabled').first().click();
  await expect(page.locator('button[data-date][aria-pressed="true"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const dropdown = page.getByRole("combobox", { name: "Appointment time" });
  const next = page.getByRole("button", { name: "Continue", exact: true });
  await expect(dropdown).toHaveCount(0);
  await expect(next).toBeDisabled();
  await page.getByRole("radio", { name: /^Morning/ }).check();
  await expect(dropdown.locator("option")).toHaveText(["Choose a time", "9:00 AM"]);
  await dropdown.selectOption({ index: 1 });
  await expect(next).toBeEnabled();
  await page.getByRole("radio", { name: /^Afternoon/ }).check();
  await expect(dropdown).toHaveValue("");
  await expect(next).toBeDisabled();
  await expect(dropdown.locator("option")).toHaveText(["Choose a time", "12:00 PM", "5:45 PM"]);
  await page.getByRole("radio", { name: /^Night/ }).check();
  await expect(dropdown.locator("option")).toHaveText(["Choose a time", "6:00 PM"]);
  await dropdown.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.locator('button[data-date]:enabled').nth(1).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(dropdown).toHaveCount(0);
  await expect(page.locator('input[name="period"]:checked')).toHaveCount(0);
});
