import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../node_modules/supabase/dist/supabase.js", import.meta.url));
const result = spawnSync(process.execPath, [cli, "gen", "types", "typescript", "--local", "--schema", "public"], { encoding: "utf8" });
if (result.status !== 0 || !result.stdout.includes("export type Database")) {
  console.error(result.stderr || "Database type generation failed. Start local Supabase first.");
  process.exit(1);
}
writeFileSync(new URL("../src/lib/types/database.ts", import.meta.url), result.stdout);
console.log("Generated src/lib/types/database.ts from the local schema.");
