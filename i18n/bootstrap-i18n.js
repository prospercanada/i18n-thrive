/*! ThriveI18n v1.0 - runtime */
(function () {
  const ATTRS = ["aria-label", "title", "alt", "placeholder", "value"];
  const STORE_KEY = "lang";
  const DEFAULT_LANG = "en";

  const state = {
    lang: null,
    catalogs: {},
    opts: null,
    observer: null,
  };

  function getLang() {
    const v = (localStorage.getItem(STORE_KEY) || DEFAULT_LANG).toLowerCase();
    return v === "fr" ? "fr" : "en";
  }
  function setLang(next) {
    const v = next === "fr" ? "fr" : "en";
    localStorage.setItem(STORE_KEY, v);
    location.reload();
  }

  async function loadJSON(url) {
    const r = await fetch(url, { cache: "force-cache" });
    if (!r.ok) throw new Error(`Fetch failed: ${url}`);
    return r.json();
  }

  function mergeCatalogs(objs) {
    const out = {};
    for (const o of objs) Object.assign(out, o || {});
    return out;
  }

  function setHtmlLang(lang) {
    document.documentElement.setAttribute("lang", lang);
  }

  function applyToElement(el, tmap) {
    const key = el.getAttribute("data-i18n");
    if (key) {
      const msg = tmap[key];
      if (msg != null) {
        if (el.hasAttribute("data-i18n-html")) {
          el.innerHTML = msg;
        } else {
          el.textContent = msg;
        }
      }
    }
    const map = el.getAttribute("data-i18n-attr");
    if (map) {
      map.split(",").forEach((pair) => {
        const [attr, k] = pair.split(":").map((s) => s.trim());
        if (!attr || !k) return;
        if (!ATTRS.includes(attr)) return;
        const val = tmap[k];
        if (val != null) el.setAttribute(attr, val);
      });
    }
  }

  function applyAll(tmap) {
    document
      .querySelectorAll("[data-i18n]")
      .forEach((el) => applyToElement(el, tmap));
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      if (!el.hasAttribute("data-i18n")) applyToElement(el, tmap);
    });
  }

  function startObserver(tmap) {
    if (state.observer) state.observer.disconnect();
    if (!state.opts || !state.opts.observeMutations) return;
    state.observer = new MutationObserver(() => applyAll(tmap));
    state.observer.observe(document.body, { subtree: true, childList: true });
  }

  async function init(opts) {
    state.opts = Object.assign(
      { namespaces: ["common"], observeMutations: false },
      opts || {}
    );
    const lang = getLang();
    state.lang = lang;
    setHtmlLang(lang);

    if (lang === "en") return;

    const manifest = await loadJSON(state.opts.manifestUrl);
    const files = [];
    for (const ns of state.opts.namespaces) {
      const name = `${ns}.${lang}`;
      const file = manifest[name];
      if (!file) continue;
      const base = new URL(state.opts.manifestUrl, location.origin);
      const url = new URL(file, base);
      files.push(url.toString());
    }

    const catalogs = await Promise.all(files.map(loadJSON));
    const tmap = mergeCatalogs(catalogs);
    state.catalogs = tmap;

    applyAll(tmap);
    startObserver(tmap);
  }

  function t(key) {
    if (state.lang !== "fr") return key;
    return state.catalogs[key] ?? key;
  }

  function fmtNumber(n, opts) {
    return new Intl.NumberFormat(
      state.lang === "fr" ? "fr-CA" : "en-CA",
      opts
    ).format(n);
  }
  function fmtDate(d, opts) {
    const dt = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat(
      state.lang === "fr" ? "fr-CA" : "en-CA",
      opts
    ).format(dt);
  }

  window.ThriveI18n = { init, getLang, setLang, t, fmtNumber, fmtDate };
})();
