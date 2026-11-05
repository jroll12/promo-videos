#!/usr/bin/env node
// Summarise `hyperframes check --json` output: findings grouped by section and rule, info-level hidden.
//   hyperframes check --json > build/check.json; node check_summary.mjs build/check.json
// Exit code 1 when `ok` is false, so it can gate a script.
import fs from "node:fs";

const c = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
console.log(`check ok: ${c.ok}${c.browserSkipped ? " (browser gate SKIPPED: layout/contrast were not checked)" : ""}`);
for (const k of ["lint", "runtime", "layout", "motion", "contrast", "craft", "audio"]) {
  const s = c[k];
  if (!s) continue;
  console.log(`== ${k}: ok=${s.ok} errors=${s.errorCount} warnings=${s.warningCount}`);
  const groups = {};
  for (const f of (s.findings || []).filter((x) => x.severity !== "info")) {
    const key = `${f.severity} ${f.code} | ${(f.selector || "").slice(0, 70)}`;
    (groups[key] ||= []).push(f.time);
  }
  for (const [key, times] of Object.entries(groups)) {
    const t = times.filter((x) => x != null).map((x) => x.toFixed(1)).join(",");
    console.log(`   ${key}${t ? "  @ " + t + " s" : ""}`);
  }
}
process.exit(c.ok ? 0 : 1);
