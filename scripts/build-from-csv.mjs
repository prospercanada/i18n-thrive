// scripts/build-from-csv.mjs
// Usage: node scripts/build-from-csv.mjs path/to/file.csv [outDir=i18n] [namespace]
import fs from "node:fs";
import path from "node:path";

const [, , csvPath, outDir = "i18n", nsArg] = process.argv;
if (!csvPath) throw new Error("Usage: node scripts/build-from-csv.mjs <csvPath> [outDir] [namespace]");

let csv = fs.readFileSync(csvPath, "utf8");
// strip BOM
if (csv.charCodeAt(0) === 0xfeff) csv = csv.slice(1);
csv = csv.trim();

const lines = csv.split(/\r?\n/);
const header = (lines[0] || "").trim().toLowerCase();

// auto-skip header if it looks like one
const body = /^key\s*,\s*en\s*,\s*fr\s*,\s*selector\s*,\s*type\s*,\s*attr$/.test(header)
  ? lines.slice(1)
  : lines;

// CSV fields: key,en,fr,selector,type,attr
function parseLine(line) {
  // normalize smart quotes in selectors (" ” → ")
  line = line.replace(/[“”]/g, '"');
  // robust split with quoted fields
  const re = /("([^"]|"")*"|[^,]*)(?:,|$)/g;
  const cells = [];
  let m;
  while ((m = re.exec(line)) && cells.length < 6) {
    let v = m[1] ?? "";
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
    cells.push(v.trim());
  }
  while (cells.length < 6) cells.push("");
  return cells;
}

const en = {};
const fr = {};
const map = [];
const seenKey = new Map();       // detect key-text conflicts
const seenMapRow = new Set();    // dedupe identical map rows

function assertConsistent(dict, key, val, lang) {
  if (!key) return;
  const prev = dict[key];
  if (prev != null && prev !== val) {
    throw new Error(`Key conflict for "${key}" (${lang}):\n - "${prev}" vs "${val}"`);
  }
  dict[key] = val;
}

for (const raw of body) {
  if (!raw || !raw.trim() || raw.trim().startsWith("#")) continue; // allow comments

  const [key, enText, frText, selector, type, attr] = parseLine(raw);

  // catalog consistency
  if (key) {
    if (enText) assertConsistent(en, key, enText, "en");
    if (frText) assertConsistent(fr, key, frText, "fr");
  }

  // map row validation
  if (selector && type) {
    const t = type.toLowerCase();
    if (t !== "text" && t !== "attr") {
      throw new Error(`Invalid type "${type}" for key "${key}" (expected "text" or "attr")`);
    }
    if (t === "attr" && !attr) {
      throw new Error(`Missing 'attr' for attr-type key "${key}" (selector: ${selector})`);
    }
    const rowSig = JSON.stringify({ selector, type: t, key, attr: t === "attr" ? attr : undefined });
    if (!seenMapRow.has(rowSig)) {
      seenMapRow.add(rowSig);
      map.push(JSON.parse(rowSig));
    }
  }
}

// stable sort for clean diffs
const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
const enSorted = sortObj(en);
const frSorted = sortObj(fr);

const filename = path.basename(csvPath);
const nsGuess =
  nsArg ||
  filename.replace(/-translated\.csv$/i, "").replace(/\.csv$/i, ""); // profile-translated.csv -> profile
const namespace = nsGuess;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${namespace}.en.json`), JSON.stringify(enSorted, null, 2) + "\n");
fs.writeFileSync(path.join(outDir, `${namespace}.fr.json`), JSON.stringify(frSorted, null, 2) + "\n");
fs.writeFileSync(path.join(outDir, `${namespace}.map.json`), JSON.stringify(map, null, 2) + "\n");

console.log(`Wrote:
 - ${path.join(outDir, `${namespace}.en.json`)}
 - ${path.join(outDir, `${namespace}.fr.json`)}
 - ${path.join(outDir, `${namespace}.map.json`)}`);
