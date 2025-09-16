import fs from "node:fs/promises";
const IN = process.argv[2] || "i18n-build/profile-translated.csv";
const OUT = process.argv[3] || "i18n-build/profile.fr.json";

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  // drop empty lines
  const keep = lines.filter(l => l.trim().length);
  const re = /"([^"]|"")*"|[^,]+/g;

  const split = (line) => (line.match(re) || []).map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"'));
  const header = split(keep[0]);
  const idx = (name) => header.indexOf(name);

  const iKey = idx("key");
  const iFr  = idx("fr");
  if (iKey === -1 || iFr === -1) throw new Error(`CSV must have "key" and "fr" columns`);

  const out = {};
  for (let i = 1; i < keep.length; i++) {
    const cols = split(keep[i]);
    const key = cols[iKey]?.trim();
    const fr  = cols[iFr]?.trim();
    if (!key) continue;
    if (fr) out[key] = fr; // only include translated rows (fallback to EN at runtime)
  }
  return out;
}

(async () => {
  const csv = await fs.readFile(IN, "utf8");
  const map = parseCSV(csv);
  await fs.writeFile(OUT, JSON.stringify(map, null, 2), "utf8");
  console.log(`Wrote ${OUT} with ${Object.keys(map).length} entries`);
})();
