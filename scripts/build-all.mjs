// scripts/build-all.mjs
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "i18n-build"); // CSVs live here
const OUTPUT = path.join(ROOT, "i18n"); // JSON goes here

fs.mkdirSync(OUTPUT, { recursive: true });

const files = fs.readdirSync(INPUT).filter((f) => f.endsWith(".csv"));

for (const f of files) {
  const ns = f.replace(/-translated\.csv$/, "").replace(/\.csv$/, "");
  const csvPath = path.join(INPUT, f);
  execSync(`node scripts/build-from-csv.mjs "${csvPath}" "${OUTPUT}" "${ns}"`, {
    stdio: "inherit",
  });
}
