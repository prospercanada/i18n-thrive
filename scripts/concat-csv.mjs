// concat-csv.mjs
// Node 16+ (ESM)

import fs from "fs";
import fsp from "fs/promises";
import path from "path";

function stripBOM(text) {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}

function normalizeNewlines(text) {
  return text.replace(/\r\n?/g, "\n");
}

// Returns { header: string, rows: string[] } where rows excludes the header line
function splitHeaderAndRows(content) {
  const lines = content.split("\n");
  // find first non-empty, non-comment line => treat as header
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue; // skip empty
    if (l.startsWith("#")) continue; // skip comments
    headerIdx = i;
    break;
  }
  if (headerIdx === -1) {
    return { header: "", rows: [] };
  }
  const header = lines[headerIdx];
  const rows = lines.slice(headerIdx + 1);
  return { header, rows };
}

async function main() {
  const [inputDir, outputFile] = process.argv.slice(2);
  if (!inputDir || !outputFile) {
    console.error("Usage: node concat-csv.mjs <input-folder> <output-file>");
    process.exit(1);
  }

  const stat = await fsp.stat(inputDir).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    console.error(`Input path is not a directory: ${inputDir}`);
    process.exit(1);
  }

  const entries = await fsp.readdir(inputDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".csv"))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (!files.length) {
    console.error("No .csv files found.");
    process.exit(1);
  }

  let masterHeader = null;
  const out = [];

  for (let i = 0; i < files.length; i++) {
    const name = files[i];
    const full = path.join(inputDir, name);
    let text = await fsp.readFile(full, "utf8");
    text = normalizeNewlines(stripBOM(text));

    // Keep a visible section separator for reconstruction
    out.push(`\n# === FILE: ${name} ===\n`);

    const { header, rows } = splitHeaderAndRows(text);

    if (i === 0) {
      masterHeader = header || "";
      if (masterHeader) out.push(masterHeader);
      // keep all rows after header
      if (rows.length) out.push(rows.join("\n"));
    } else {
      // For subsequent files, ensure header matches (optional check)
      // If you want to enforce identical headers, uncomment below:
      // if (masterHeader && header && header !== masterHeader) {
      //   console.warn(`Header mismatch in ${name}`);
      // }

      // Append rows only (skip header)
      if (rows.length) out.push(rows.join("\n"));
    }
    console.log(`${i === 0 ? "Writing" : "Appending"}: ${name}`);
  }

  // Clean up repeated blank lines and ensure trailing newline
  const merged =
    out
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s+|\s+$/g, "") + "\n";

  //   await fsp.writeFile(outputFile, merged, "utf8");
  await fsp.writeFile(outputFile, "\uFEFF" + merged, "utf8"); // prepend UTF-8 BOM
  console.log(`Done. Combined CSV written to: ${outputFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
