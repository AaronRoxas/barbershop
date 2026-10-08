import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const target = new URL("../.env.local", import.meta.url);
const useLocal = process.argv.includes("--use-local");
if (existsSync(target) && !useLocal) {
  console.error(".env.local already exists. Update it manually; existing credentials were preserved.");
  process.exit(1);
}
const cli = fileURLToPath(new URL("../node_modules/supabase/dist/supabase.js", import.meta.url));
const result = spawnSync(process.execPath, [cli, "status", "--output", "json"], { encoding: "utf8" });
if (result.status !== 0) {
  console.error("Local Supabase is unavailable. Run npm run db:start first.");
  process.exit(1);
}
const status = JSON.parse(result.stdout);
if (!status.API_URL || !status.ANON_KEY || !status.SERVICE_ROLE_KEY) {
  console.error("Local Supabase did not return the expected configuration.");
  process.exit(1);
}
const values = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG: "reference",
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
};
let content = existsSync(target) ? readFileSync(target, "utf8") : "# Local Supabase only. This file is ignored by Git.\n";
for (const [name, value] of Object.entries(values)) {
  const pattern = new RegExp(`^(?:export\\s+)?${name}\\s*=.*$`, "m");
  content = pattern.test(content) ? content.replace(pattern, `${name}=${value}`) : `${content.trimEnd()}\n${name}=${value}\n`;
}
writeFileSync(target, content, { flag: useLocal ? "w" : "wx" });
console.log("Configured .env.local with local Supabase credentials; no keys were printed.");
