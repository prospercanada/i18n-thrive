import fs from "node:fs/promises";

const IN  = process.argv[2] || "i18n-build/profile-translated.csv";
const OUT = process.argv[3] || "i18n/profile.map.json";

// very small CSV splitter that respects quoted cells
function splitCSV(line) {
  const re = /"([^"]|"")*"|[^,]+/g;
  return (line.match(re) || [])
    .map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"'));
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  const header = splitCSV(lines[0]);
  const idx = (name) => header.indexOf(name);

  const iKey = idx("key");
  const iSel = idx("selector");
  const iType = idx("type");
  const iAttr = idx("attr");

  if ([iKey, iSel, iType].some(i => i === -1)) {
    throw new Error('CSV must include columns: key, selector, type (and optional attr)');
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSV(lines[i]);
    const key  = (cols[iKey] || "").trim();
    const selector = (cols[iSel] || "").trim();
    const type = (cols[iType] || "").trim().toLowerCase();
    const attr = (cols[iAttr] || "").trim();

    // skip incomplete rows
    if (!key || !selector || !type) continue;
    if (type !== "text" && type !== "attr") continue;

    // build entry
    const entry = { selector, type, key };
    if (type === "attr" && attr) entry.attr = attr;
    rows.push(entry);
  }
  return rows;
}

(async () => {
  const csv = await fs.readFile(IN, "utf8");
  const map = parseCSV(csv);

  // Optional: de-duplicate identical entries
  const seen = new Set();
  const dedup = [];
  for (const e of map) {
    const sig = `${e.selector}|${e.type}|${e.attr || ""}|${e.key}`;
    if (!seen.has(sig)) { seen.add(sig); dedup.push(e); }
  }

  await fs.mkdir(OUT.replace(/[/\\][^/\\]+$/, ""), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(dedup, null, 2), "utf8");
  console.log(`Wrote ${OUT} with ${dedup.length} entries`);
})();
