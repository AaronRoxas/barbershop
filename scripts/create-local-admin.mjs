import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { emitKeypressEvents } from "node:readline";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// Explicitly local; do not provision accounts in a hosted project from this helper.
const result = spawnSync(process.execPath, ["node_modules/supabase/dist/supabase.js", "status", "--output", "json"], { encoding: "utf8" });
if (result.status !== 0) { console.error("Start local Supabase first."); process.exit(1); }
const status = JSON.parse(result.stdout);
if (!["127.0.0.1", "localhost"].includes(new URL(status.API_URL).hostname)) throw new Error("Local Supabase is required.");
const args = process.argv.slice(2);
const emailIndex = args.indexOf("--email");
let email = emailIndex < 0 ? "" : args[emailIndex + 1] ?? "";
if (!email) {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  email = await prompt.question("Local admin email: "); prompt.close();
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Enter a valid email.");
async function readPassword() {
  if (!process.stdin.isTTY) throw new Error("Run this script in an interactive terminal.");
  emitKeypressEvents(process.stdin);
  process.stdout.write("Local admin password (12+ characters): ");
  process.stdin.setRawMode(true); process.stdin.resume();
  return new Promise((resolve, reject) => {
    let password = "";
    const finish = () => { process.stdin.off("keypress", keypress); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write("\n"); };
    function keypress(value, key) {
      if (key?.ctrl && key.name === "c") { finish(); reject(new Error("Cancelled.")); }
      else if (key?.name === "return") { finish(); resolve(password); }
      else if (key?.name === "backspace") { if (password.length) { password = password.slice(0, -1); process.stdout.write("\b \b"); } }
      else if (value && !key?.ctrl && !key?.meta && !value.includes("\u001b")) { password += value; process.stdout.write("*".repeat(value.length)); }
    }
    process.stdin.on("keypress", keypress);
  });
}
const password = await readPassword();
if (password.length < 12 || password.length > 200) throw new Error("Use 12–200 characters.");
const client = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: WebSocket } });
const { data: business, error } = await client.from("businesses").select("id").eq("slug", "reference").single();
if (error) throw new Error("Reference shop is unavailable. Apply local migrations and fixtures first.");
const created = await client.auth.admin.createUser({ email, password, email_confirm: true });
if (created.error) throw new Error("Unable to create account. For an existing account, provision its membership in Supabase Studio.");
const membership = await client.from("business_members").insert({ business_id: business.id, user_id: created.data.user.id, role: "owner" });
if (membership.error) { await client.auth.admin.deleteUser(created.data.user.id); throw new Error("Unable to provision shop membership."); }
console.log("Local reference-shop owner created. Sign in at /admin/login.");
