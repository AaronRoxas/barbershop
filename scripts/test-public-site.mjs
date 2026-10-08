import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Browser tests always target local fixtures. Keep .env.local and hosted credentials untouched.
const result = spawnSync(process.execPath, ["node_modules/supabase/dist/supabase.js", "status", "--output", "json"], { encoding: "utf8" });
if (result.status !== 0) {
  console.error("Start local Supabase with npm run db:start before testing the public website.");
  process.exit(1);
}
const status = JSON.parse(result.stdout);
if (!["127.0.0.1", "localhost"].includes(new URL(status.API_URL).hostname)) process.exit(1);
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG: "reference", NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100" };
const run = (path, args) => {
  const child = spawnSync(process.execPath, [fileURLToPath(new URL(path, import.meta.url)), ...args], { env, stdio: "inherit" });
  if (child.status !== 0) process.exit(child.status || 1);
};
const args = process.argv.slice(2);
if (!args.includes("--skip-build")) run("../node_modules/next/dist/bin/next", ["build"]);
run("../node_modules/@playwright/test/cli.js", ["test", ...args.filter((arg) => arg !== "--skip-build")]);
