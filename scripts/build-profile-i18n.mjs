import fs from "node:fs/promises";
import path from "node:path";

const INPUT = "thrive-pages/profile-page.json";
const OUT_DIR = "i18n-build";

const STOP_PATTERNS = [
  /^_hjSafeContext/i,
  /^11pt$/i,
  /^Paragraph$/i,
  /^To open the popup/i,
  /^ribbon$/i,
];

const COMMON_WORDS = new Set([
  "Inbox",
  "Profile",
  "My Communities",
  "Followed Content",
  "Log Out",
  "Create",
  "Discussion Thread",
  "Library Entry",
  "Blog Post",
  "Actions",
  "Change Picture",
  "Restore Default Image",
  "Cancel",
  "Save",
  "Submit",
  "Close",
  "Search Box",
  "search",
  "Toggle navigation",
]);

const toSlug = (s, maxWords = 4) =>
  s
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join("-")
    .toLowerCase();

const selectorToKey = (sel) => {
  if (!sel) return "el";
  // #MainCopy_ctl27_ProfileLink -> maincopy.ctl27.profilelink
  return sel
    .replace(/^#/, "")
    .replace(/[_-]+/g, ".")
    .replace(/[^a-zA-Z0-9.]/g, "")
    .replace(/\.+/g, ".")
    .toLowerCase();
};

const isStop = (text) => STOP_PATTERNS.some((rx) => rx.test(text));

const readJSON = async (file) => JSON.parse(await fs.readFile(file, "utf8"));

const recordsToCatalog = (rows) => {
  // 1) normalize + filter
  const cleaned = rows
    .map((r) => ({
      ...r,
      source: (r.source || "").replace(/\s+/g, " ").trim(),
    }))
    .filter((r) => r.source && !isStop(r.source));

  // 2) dedupe exact source+attr
  const seen = new Set();
  const deduped = [];
  for (const r of cleaned) {
    const k = `${r.type}|${r.attr || ""}|${r.source}`;
    if (!seen.has(k)) {
      seen.add(k);
      deduped.push(r);
    }
  }

  // 3) build keys
  const out = [];
  for (const r of deduped) {
    const base = COMMON_WORDS.has(r.source)
      ? `common.${toSlug(r.source)}`
      : `profile.${selectorToKey(r.selector)}.${toSlug(r.source)}`;

    const key =
      r.type === "attr" && r.attr ? `${base}@${r.attr.toLowerCase()}` : base;

    out.push({
      key,
      en: r.source,
      selector: r.selector || "",
      type: r.type,
      attr: r.attr || "",
    });
  }
  return out;
};

const toJSONMap = (rows) => {
  const obj = {};
  for (const r of rows) obj[r.key] = r.en;
  return obj;
};

const toCSV = (rows) => {
  const head = ["key", "en", "selector", "type", "attr"];
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  return [
    head.join(","),
    ...rows.map((r) =>
      [r.key, r.en, r.selector, r.type, r.attr].map(esc).join(",")
    ),
  ].join("\n");
};

(async () => {
  const rows = await readJSON(INPUT);
  const catalog = recordsToCatalog(rows);

  await fs.mkdir(OUT_DIR, { recursive: true });

  // EN JSON for runtime fallback/reference
  await fs.writeFile(
    path.join(OUT_DIR, "profile.en.json"),
    JSON.stringify(toJSONMap(catalog), null, 2),
    "utf8"
  );

  // CSV for translators
  await fs.writeFile(path.join(OUT_DIR, "profile.csv"), toCSV(catalog), "utf8");

  console.log(
    `Wrote ${catalog.length} keys → ${OUT_DIR}/profile.en.json and ${OUT_DIR}/profile.csv`
  );
})();
