// Isolated browser verification: real editor and CSS, stubbed save action, no database access.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const require = createRequire(import.meta.url);
const root = process.cwd();
const output = path.join(root, ".next", "weekly-schedule-check");
await fs.mkdir(output, { recursive: true });
const helpers = await fs.readFile(path.join(root, "src/lib/time/weekly-schedule.ts"), "utf8");
const compiled = ts.transpileModule(helpers, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const helperModule = { exports: {} };
new Function("exports", "module", compiled)(helperModule.exports, helperModule);
const { dayError, scheduleFromHours, serializeDay, splitPeriod, sortPeriods } = helperModule.exports;
assert.equal(serializeDay(scheduleFromHours([])[0]), "");
assert.match(dayError({ open: true, periods: [{ start: "22:00", end: "02:00" }] }), /overnight/);
assert.match(dayError({ open: true, periods: [{ start: "09:00", end: "13:00" }, { start: "12:00", end: "18:00" }] }), /overlap/);
assert.equal(dayError({ open: true, periods: [{ start: "09:00", end: "12:00" }, { start: "12:00", end: "18:00" }] }), undefined);
assert.equal(sortPeriods([{ start: "13:00" }, { start: "09:00" }])[0].start, "09:00");
assert.equal(splitPeriod({ id: "one", start: "09:00", end: "18:00" }, "two")[1].start, "13:45");

await fs.writeFile(path.join(output, "loader.cjs"), `const ts = require(${JSON.stringify(require.resolve("typescript"))}); module.exports = function(source) { return ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText; };`);
await fs.writeFile(path.join(output, "actions.ts"), `export async function saveHours(_, form) { window.__saved = Object.fromEntries(form); return { success: 'Weekly hours saved.' }; }`);
await fs.writeFile(path.join(output, "entry.tsx"), `import React from 'react'; import { createRoot } from 'react-dom/client'; import { ScheduleEditor } from '@/components/admin/schedule-editor';
const hours = Array.from({length:5}, (_,i)=>({weekday:i+1,opens_at:'09:00',closes_at:'18:00'}));
createRoot(document.getElementById('root')).render(<ScheduleEditor barbers={[{id:'alex',name:'Alex',is_active:true}]} shopHours={hours} barberHours={[]} />);`);
const webpack = require("next/dist/compiled/webpack/webpack");
await new Promise((resolve, reject) => {
  const compiler = webpack.webpack({ mode: "development", devtool: false, target: "web", entry: path.join(output, "entry.tsx"),
    output: { path: output, filename: "editor.js" }, resolve: { extensions: [".tsx", ".ts", ".js"], alias: { "@/app/admin/actions": path.join(output, "actions.ts"), "@": path.join(root, "src") } },
    module: { rules: [{ test: /\.tsx?$/, use: path.join(output, "loader.cjs") }] } });
  compiler.run((error, stats) => compiler.close(() => error || stats.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
});
const browser = await chromium.launch();
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    const failures = [];
    page.on("pageerror", (error) => failures.push(error.message));
    await page.route("http://127.0.0.1:3199/**", (route) => route.fulfill({ contentType: "text/html", body: '<main style="width:min(1100px,calc(100% - 32px));margin:auto"><div id="root"></div><a href="https://example.com/leave">Leave page</a></main>' }));
    await page.goto("http://127.0.0.1:3199/schedule");
    await page.addStyleTag({ content: await fs.readFile(path.join(root, "node_modules/tailwindcss/preflight.css"), "utf8") });
    await page.addStyleTag({ content: await fs.readFile(path.join(root, "src/app/globals.css"), "utf8") + "\n:root { --font-sans: system-ui, sans-serif; --font-serif: Georgia, serif; }" });
    await page.addScriptTag({ path: path.join(output, "editor.js") });
    const active = () => page.locator('.schedule-editor > div:not([hidden])').filter({ has: page.locator('form') });
    const rows = () => active().locator(".schedule-row");
    await page.getByRole("switch", { name: "Monday open", exact: true }).waitFor();
    assert.equal(await rows().count(), 7);
    assert.equal(await active().getByLabel("Monday period 1 start hour", { exact: true }).inputValue(), "9", "Initial hour selection");
    assert.equal(await page.getByRole("button", { name: "Save weekly hours" }).isDisabled(), true);
    await page.getByRole("switch", { name: "Monday open", exact: true }).uncheck();
    assert.equal(await rows().first().locator('input[name="day1"]').inputValue(), "");
    await page.getByRole("switch", { name: "Monday open", exact: true }).check();
    await active().getByLabel("Monday period 1 start minute", { exact: true }).selectOption("15");
    assert.equal(await page.getByRole("button", { name: "Save weekly hours" }).isEnabled(), true);
    await page.getByLabel("Schedule for", { exact: true }).selectOption("alex");
    await page.getByRole("button", { name: "Use shop hours" }).click();
    await page.getByLabel("Schedule for", { exact: true }).selectOption("");
    assert.equal(await active().getByLabel("Monday period 1 start minute", { exact: true }).inputValue(), "15");
    await page.getByRole("button", { name: "Copy Monday hours", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "All other days" }).click();
    await page.getByRole("button", { name: "Replace 6 days" }).click();
    assert.equal(await rows().nth(6).locator('input[name="day7"]').inputValue(), "09:15-18:00");
    await rows().first().getByText("More", { exact: true }).click();
    await page.getByRole("button", { name: "Add break", exact: true }).click();
    assert.equal(await rows().first().locator(".schedule-period").count(), 2);
    await active().getByLabel("Monday period 2 start hour", { exact: true }).selectOption("12");
    assert.match(await rows().first().getByRole("alert").innerText(), /overlap/);
    assert.equal(await page.getByRole("button", { name: "Save weekly hours" }).isDisabled(), true);
    await page.getByRole("button", { name: "Remove Monday period 2", exact: true }).click();
    await active().getByLabel("Monday period 1 end hour", { exact: true }).selectOption("8");
    await active().getByLabel("Monday period 1 end AM or PM", { exact: true }).selectOption("AM");
    assert.match(await rows().first().getByRole("alert").innerText(), /overnight/);
    await page.getByRole("button", { name: "Cancel changes" }).click();
    assert.equal(await rows().first().locator('input[name="day1"]').inputValue(), "09:00-18:00");
    await page.getByRole("button", { name: "Copy Monday hours", exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    await active().getByLabel("Monday period 1 start minute", { exact: true }).selectOption("30");
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("link", { name: "Leave page" }).click();
    assert.equal(page.url(), "http://127.0.0.1:3199/schedule");
    await page.getByRole("button", { name: "Save weekly hours" }).click();
    await page.getByText("Weekly hours saved.", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.__saved.day1), "09:30-18:00");
    assert.equal(await active().getByLabel("Monday period 1 start hour", { exact: true }).inputValue(), "9");
    assert.equal(await active().getByLabel("Monday period 1 start minute", { exact: true }).inputValue(), "30");
    assert.equal(await active().getByLabel("Monday period 1 end AM or PM", { exact: true }).inputValue(), "PM");
    assert.equal(await page.getByRole("button", { name: "Save weekly hours" }).isDisabled(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow at ${width}px`);
    const accessibility = await new AxeBuilder({ page }).include(".schedule-editor").analyze();
    assert.deepEqual(accessibility.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })), []);
    assert.deepEqual(failures, []);
    await page.screenshot({ path: path.join(output, `schedule-${width}.png`), fullPage: true });
    await context.close();
    console.log(`Passed editor interactions, accessibility and layout at ${width}px.`);
  }
} finally { await browser.close(); }
