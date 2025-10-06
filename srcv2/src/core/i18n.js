// src/core/i18n.js
let state = {
  lang: "en",
  catalogs: {},
  opts: null, // { manifestUrl, namespaces, observeMutations }
  observer: null,
  ready: false,
  pending: [],
  isApplying: false,
};

const STORE_KEY = "preferredLang";
const ATTRS = new Set([
  "aria-label",
  "title",
  "alt",
  "placeholder",
  "value",
  "data-i18n-text",
  "data-content",
  "data-original-title",
]);

// ----------------- utilities -----------------
const normalizeLang = (v) =>
  String(v || "en").toLowerCase() === "fr" ? "fr" : "en";

function setDocumentLang(lang) {
  const code = normalizeLang(lang);
  document.documentElement.setAttribute("data-lang", code);
  document.documentElement.setAttribute(
    "lang",
    code === "fr" ? "fr-CA" : "en-CA"
  );
  // Broadcast to any listeners (toggle, dynamic renderers, etc.)
  window.dispatchEvent(
    new CustomEvent("langchange", { detail: { lang: code } })
  );
}

function firstTextNode(el) {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      return n.nodeValue && n.nodeValue.trim() ? 1 : 2;
    },
  });
  return w.nextNode();
}

function sameHTML(a, b) {
  if (a === b) return true;
  return (
    a.replace(/\u00A0/g, "&nbsp;").trim() ===
    b.replace(/\u00A0/g, "&nbsp;").trim()
  );
}

function setFirstText(el, txt) {
  const tn = firstTextNode(el);
  if (tn) {
    if (tn.nodeValue !== txt) tn.nodeValue = txt;
  } else if (el.textContent !== txt) {
    el.textContent = txt;
  }
}

// ----------------- fetch caches -----------------
const jsonCache = new Map(); // url -> Promise(json)
async function loadJSON(url) {
  if (jsonCache.has(url)) return jsonCache.get(url);
  const p = fetch(url, { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(`Failed to fetch ${url} (${r.status})`);
    return r.json();
  });
  jsonCache.set(url, p);
  return p;
}

let _manifestP = null;
function getManifest(url) {
  if (_manifestP) return _manifestP;
  _manifestP = loadJSON(url);
  return _manifestP;
}

const nsMapCache = new Map(); // ns -> Promise(mapArray)
async function getMap(manifestUrl, ns) {
  if (nsMapCache.has(ns)) return nsMapCache.get(ns);
  const p = (async () => {
    const manifest = await getManifest(manifestUrl);
    const file = manifest[`${ns}.map`];
    if (!file) return null;
    const base = new URL(manifestUrl, location.origin);
    const url = new URL(file, base).toString();
    return loadJSON(url);
  })();
  nsMapCache.set(ns, p);
  return p;
}

const catalogCache = new Map(); // `${ns}:${lang}` -> Promise(object)
async function loadCatalogs(manifestUrl, namespaces, lang) {
  const manifest = await getManifest(manifestUrl);
  const base = new URL(manifestUrl, location.origin);
  const promises = (namespaces || []).map((ns) => {
    const key = `${ns}:${lang}`;
    if (catalogCache.has(key)) return catalogCache.get(key);
    const rel = manifest[`${ns}.${lang}`];
    if (!rel) return Promise.resolve({});
    const url = new URL(rel, base).toString();
    const p = loadJSON(url);
    catalogCache.set(key, p);
    return p;
  });
  const parts = await Promise.all(promises);
  return Object.assign({}, ...parts);
}

// ----------------- map attach (idempotent) -----------------
function parseAttrPairs(str) {
  const map = new Map();
  if (!str) return map;
  for (const part of str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)) {
    const [attr, key] = part.split(":").map((s) => s.trim());
    if (attr && key) map.set(attr, key);
  }
  return map;
}

function stringifyAttrPairs(map) {
  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
    .map(([attr, key]) => `${attr}:${key}`)
    .join(",");
}

function attachMaps(entries, root = document) {
  for (const e of entries || []) {
    const { selector, type, attr, key } = e || {};
    if (!selector || !key) continue;

    const nodes = root.querySelectorAll(selector);
    if (!nodes.length) continue;

    nodes.forEach((el) => {
      if (type === "text" || type === "html") {
        if (el.getAttribute("data-i18n") !== key)
          el.setAttribute("data-i18n", key);
        if (type === "html") el.setAttribute("data-i18n-html", "true");
      } else if (type === "attr" && attr) {
        const cur = parseAttrPairs(el.getAttribute("data-i18n-attr"));
        cur.set(attr, key); // overwrite per-attr (no dupes)
        const next = stringifyAttrPairs(cur);
        if (el.getAttribute("data-i18n-attr") !== next)
          el.setAttribute("data-i18n-attr", next);
      }
    });
  }
}

// ----------------- translation apply -----------------
function applyToElement(el, tmap) {
  // element text/html
  const key = el.getAttribute("data-i18n");
  if (key && tmap[key] != null) {
    const val = String(tmap[key]);
    // ✅ use language (and optionally length) — NOT just length
    const sig = `${key}§${state.lang}§${val.length}`;

    if (el.dataset.i18nApplied !== sig) {
      if (el.hasAttribute("data-i18n-html")) {
        if (!sameHTML(el.innerHTML, val)) el.innerHTML = val;
      } else {
        const txt = val.replace(/&nbsp;/g, "\u00A0");
        const tn = firstTextNode(el);
        const current = tn ? tn.nodeValue : el.textContent;
        if (current !== txt) setFirstText(el, txt);
      }
      el.dataset.i18nApplied = sig; // ← now changes when lang changes
    }
  }

  //   if (key && tmap[key] != null) {
  //     const val = String(tmap[key]);
  //     const wantsHtml = el.hasAttribute("data-i18n-html");
  //     const sig = key + "§" + val.length;

  //     if (el.dataset.i18nApplied !== sig) {
  //       if (wantsHtml) {
  //         if (!sameHTML(el.innerHTML, val)) el.innerHTML = val;
  //       } else {
  //         const txt = val.replace(/&nbsp;/g, "\u00A0");
  //         const tn = firstTextNode(el);
  //         const current = tn ? tn.nodeValue : el.textContent;
  //         if (current !== txt) setFirstText(el, txt);
  //       }
  //       el.dataset.i18nApplied = sig;
  //     }
  //   }

  // attributes
  const raw = el.getAttribute("data-i18n-attr");
  if (!raw) return;

  const pairs = parseAttrPairs(raw);
  for (const [attr, k] of pairs) {
    if (!ATTRS.has(attr)) continue;
    if (tmap[k] == null) continue;

    let next = String(tmap[k]);
    if (attr === "data-i18n-text") {
      const txt = next.replace(/&nbsp;/g, "\u00A0");
      const tn = firstTextNode(el);
      const current = tn ? tn.nodeValue : "";
      if (current !== txt) {
        if (tn) tn.nodeValue = txt;
        else el.insertBefore(document.createTextNode(txt), el.firstChild);
      }
      continue;
    }

    if (
      attr === "title" ||
      attr === "aria-label" ||
      attr === "placeholder" ||
      attr === "value"
    ) {
      next = next.replace(/&nbsp;/g, "\u00A0");
    }
    if (el.getAttribute(attr) !== next) el.setAttribute(attr, next);
  }
}

function applyAll(tmap, root = document) {
  if (!tmap) return;
  root
    .querySelectorAll("[data-i18n],[data-i18n-attr]")
    .forEach((el) => applyToElement(el, tmap));
}

// ----------------- main load/apply -----------------
async function loadAndApply(lang) {
  if (!state?.opts?.manifestUrl) {
    throw new Error("ThriveI18n not initialized: missing opts.manifestUrl");
  }

  state.lang = normalizeLang(lang);
  try {
    localStorage.setItem(STORE_KEY, state.lang);
  } catch {}

  const { manifestUrl, namespaces } = state.opts;

  // Tag maps (idempotent)
  const maps = await Promise.all(
    namespaces.map((ns) => getMap(manifestUrl, ns))
  );
  for (const map of maps) {
    if (Array.isArray(map)) attachMaps(map, document);
  }

  // Load catalogs then apply
  const tmap = await loadCatalogs(manifestUrl, namespaces, state.lang);
  state.catalogs = tmap;

  state.isApplying = true;
  try {
    applyAll(tmap);
  } finally {
    state.isApplying = false;
  }
}

// ----------------- mutations (partial reloads) -----------------
let _flushScheduled = false;
const _pendingRoots = new Set();

function scheduleRoot(el) {
  if (!el || el.nodeType !== 1) return;
  _pendingRoots.add(el);
  if (!_flushScheduled) {
    _flushScheduled = true;
    queueMicrotask(flushPending);
  }
}

async function flushPending() {
  _flushScheduled = false;
  if (!_pendingRoots.size) return;

  const roots = Array.from(_pendingRoots);
  _pendingRoots.clear();

  state.isApplying = true;
  try {
    // Tag maps in these subtrees
    for (const root of roots) {
      for (const ns of state.opts.namespaces) {
        const map = await getMap(state.opts.manifestUrl, ns);
        if (map) attachMaps(map, root);
      }
    }
    // Apply within those roots
    for (const root of roots) applyAll(state.catalogs, root);
  } finally {
    state.isApplying = false;
  }
}

// ----------------- public API -----------------
export async function initI18n(opts) {
  state.opts = Object.assign(
    { namespaces: ["profile"], observeMutations: true, manifestUrl: "" },
    opts || {}
  );
  if (!state.opts.manifestUrl) throw new Error("manifestUrl required");

  // base lang
  const initial = normalizeLang(localStorage.getItem(STORE_KEY) || "en");
  setDocumentLang(initial);
  await loadAndApply(initial);
  state.ready = true;

  // React to cross-tab changes
  window.addEventListener("storage", (e) => {
    if (e.key === STORE_KEY && e.newValue && e.newValue !== state.lang) {
      setLangNoReload(e.newValue);
    }
  });

  // Observe for partial updates
  if (state.opts.observeMutations) {
    if (state.observer) state.observer.disconnect();
    state.observer = new MutationObserver((records) => {
      if (state.isApplying) return; // ignore our own writes
      for (const m of records) {
        if (m.type === "childList") {
          m.addedNodes.forEach((n) => scheduleRoot(n));
        } else if (m.type === "attributes") {
          // if our flags got added on an element, refresh that element's subtree
          scheduleRoot(m.target);
        }
      }
    });
    state.observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-i18n", "data-i18n-attr", "data-i18n-html"],
    });
  }
}

export async function setLangNoReload(next) {
  // reflect intent immediately for CSS/a11y
  setDocumentLang(next);

  if (!state.ready) {
    state.pending.push(next);
    return;
  }
  await loadAndApply(next);
}

export function t(key) {
  return state.catalogs[key] ?? key;
}

export function fmtNumber(n, o) {
  return new Intl.NumberFormat(
    state.lang === "fr" ? "fr-CA" : "en-CA",
    o
  ).format(n);
}

export function fmtDate(d, o) {
  const dt = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat(
    state.lang === "fr" ? "fr-CA" : "en-CA",
    o
  ).format(dt);
}

export function __debug() {
  return {
    lang: state.lang,
    ready: state.ready,
    hasObserver: !!state.observer,
    namespaces: state.opts?.namespaces || [],
    catalogKeys: Object.keys(state.catalogs).length,
  };
}

export function destroy() {
  if (state.observer) state.observer.disconnect();
  state = {
    lang: "en",
    catalogs: {},
    opts: null,
    observer: null,
    ready: false,
    pending: [],
    isApplying: false,
  };
  _manifestP = null;
  jsonCache.clear();
  nsMapCache.clear();
  catalogCache.clear();
}

// expose for non-module callers (toggle, console, etc.)
if (typeof window !== "undefined") {
  window.ThriveI18n = {
    init: initI18n,
    setLangNoReload,
    t,
    fmtNumber,
    fmtDate,
    __debug,
    get ready() {
      return state.ready;
    },
  };
}
