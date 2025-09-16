/*! ThriveI18n v1.0 - simple runtime */
(function () {
  const STORE_KEY = "lang";
  const DEFAULT_LANG = "en";
  const ATTRS = ["aria-label", "title", "alt", "placeholder", "value"];

  const state = {
    lang: null,
    catalogs: {},
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
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Failed to fetch ${url}`);
    return r.json();
  }

  function applyToElement(el, tmap) {
    const key = el.getAttribute("data-i18n");
    if (key && tmap[key] != null) {
      if (el.hasAttribute("data-i18n-html")) {
        el.innerHTML = tmap[key];
      } else {
        el.textContent = tmap[key];
      }
    }
    const map = el.getAttribute("data-i18n-attr");
    if (map) {
      map.split(",").forEach((pair) => {
        const [attr, k] = pair.split(":").map((s) => s.trim());
        if (!ATTRS.includes(attr)) return;
        if (tmap[k] != null) el.setAttribute(attr, tmap[k]);
      });
    }
  }

  function applyAll(tmap) {
    document
      .querySelectorAll("[data-i18n],[data-i18n-attr]")
      .forEach((el) => applyToElement(el, tmap));
  }

  async function init({
    manifestUrl,
    namespaces = [],
    observeMutations = false,
  }) {
    state.lang = getLang();
    if (state.lang === "en") return; // nothing to do

    const manifest = await loadJSON(manifestUrl);
    const files = [];

    for (const ns of namespaces) {
      const file = manifest[`${ns}.${state.lang}`];
      if (file) {
        const base = new URL(manifestUrl, location.origin);
        files.push(new URL(file, base).toString());
      }
    }

    const catalogs = await Promise.all(files.map(loadJSON));
    const tmap = Object.assign({}, ...catalogs);
    state.catalogs = tmap;

    applyAll(tmap);

    if (observeMutations) {
      const obs = new MutationObserver(() => applyAll(tmap));
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  function t(key) {
    return state.catalogs[key] ?? key;
  }

  function fmtNumber(n, opts) {
    return new Intl.NumberFormat(
      state.lang === "fr" ? "fr-CA" : "en-CA",
      opts
    ).format(n);
  }

  function fmtDate(d, opts) {
    return new Intl.DateTimeFormat(
      state.lang === "fr" ? "fr-CA" : "en-CA",
      opts
    ).format(d);
  }

  window.ThriveI18n = { init, getLang, setLang, t, fmtNumber, fmtDate };
})();
