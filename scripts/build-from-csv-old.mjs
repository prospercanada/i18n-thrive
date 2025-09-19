// scripts/build-from-csv.mjs
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const INPUT = path.join(ROOT, "i18n-build", "profile-translated.csv");
const OUT_DIR = path.join(ROOT, "i18n");

const FILES = {
  en: path.join(OUT_DIR, "profile.en.json"),
  fr: path.join(OUT_DIR, "profile.fr.json"),
  map: path.join(OUT_DIR, "profile.map.json"),
  manifest: path.join(OUT_DIR, "manifest.json"),
};

function csvParse(text) {
  // simple CSV parser (handles quotes)
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter(Boolean);
  const header = splitCSV(lines.shift());
  const rows = lines.map((line) => {
    const cols = splitCSV(line);
    const obj = {};
    header.forEach((h, i) => (obj[h.trim()] = (cols[i] ?? "").trim()));
    return obj;
  });
  return rows;

  function splitCSV(line) {
    const out = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            q = false;
          }
        } else {
          cur += c;
        }
      } else {
        if (c === '"') q = true;
        else if (c === ",") {
          out.push(cur);
          cur = "";
        } else cur += c;
      }
    }
    out.push(cur);
    return out;
  }
}

function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const csv = await fs.readFile(INPUT, "utf8");
  const rows = csvParse(csv);

  // validate headers
  const required = ["key", "en", "fr", "selector", "type", "attr"];
  const missing = required.filter((h) => !(h in rows[0]));
  if (missing.length) {
    throw new Error(`CSV missing headers: ${missing.join(", ")}`);
  }

  // build catalogs + map
  const en = {};
  const fr = {};
  const map = [];

  const dupCheck = new Set();

  for (const r of rows) {
    const key = r.key;
    const sel = r.selector;
    const type = (r.type || "text").toLowerCase();
    const attr = r.attr || "";

    if (!key || !sel) continue;

    // enforce uniqueness of (selector,type,attr) → key
    const sig = `${sel}|${type}|${attr}`;
    if (dupCheck.has(sig) === false) dupCheck.add(sig);
    else {
      // If you want to fail hard on duplicates, uncomment the next line:
      // throw new Error(`Duplicate selector/type/attr: ${sig}`);
    }

    en[key] = clean(r.en);
    fr[key] = clean(r.fr);

    map.push({
      selector: sel,
      type,
      key,
      ...(type === "attr" && attr ? { attr } : {}),
    });
  }

  // sort keys for stable diffs
  const sortKeys = (obj) =>
    Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
  const enSorted = sortKeys(en);
  const frSorted = sortKeys(fr);

  // write files
  await fs.writeFile(FILES.en, JSON.stringify(enSorted, null, 2), "utf8");
  await fs.writeFile(FILES.fr, JSON.stringify(frSorted, null, 2), "utf8");
  await fs.writeFile(FILES.map, JSON.stringify(map, null, 2), "utf8");

  // update manifest
  let manifest = {};
  try {
    const m = await fs.readFile(FILES.manifest, "utf8");
    manifest = JSON.parse(m);
  } catch (_) {}

  manifest["profile.en"] = "profile.en.json";
  manifest["profile.fr"] = "profile.fr.json";
  manifest["profile.map"] = "profile.map.json";

  await fs.writeFile(FILES.manifest, JSON.stringify(manifest, null, 2), "utf8");

  console.log("✅ Wrote:");
  console.log(" -", path.relative(ROOT, FILES.en));
  console.log(" -", path.relative(ROOT, FILES.fr));
  console.log(" -", path.relative(ROOT, FILES.map));
  console.log(" -", path.relative(ROOT, FILES.manifest));
}

main().catch((e) => {
  console.error("❌ Build failed:", e);
  process.exit(1);
});
