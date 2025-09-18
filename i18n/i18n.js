/*! ThriveI18n v1.1 - live switching */
(function () {
  const STORE_KEY = "preferredLang";
  const ATTRS = ["aria-label", "title", "alt", "placeholder", "value"];

  const state = {
    lang: "en",
    catalogs: {},
    opts: null,
    observer: null,
  };

  function firstTextNode(el) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        return n.nodeValue && n.nodeValue.trim() ? 1 : 2;
      },
    });
    return w.nextNode();
  }

  function applyToElement(el, tmap) {
    const key = el.getAttribute("data-i18n");
    if (key && tmap[key] != null) {
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = tmap[key];
      else {
        const tn = firstTextNode(el);
        if (tn) tn.nodeValue = tmap[key];
        else el.textContent = tmap[key];
      }
    }
    const map = el.getAttribute("data-i18n-attr");
    if (map) {
      map.split(",").forEach((pair) => {
        const [attr, k] = pair.split(":").map((s) => s.trim());
        if (ATTRS.includes(attr) && tmap[k] != null)
          el.setAttribute(attr, tmap[k]);
      });
    }
  }

  function applyAll(tmap) {
    if (!tmap) return;
    document
      .querySelectorAll("[data-i18n],[data-i18n-attr]")
      .forEach((el) => applyToElement(el, tmap));
  }

  async function loadJSON(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Failed to fetch ${url}`);
    return r.json();
  }

  async function loadCatalogs(manifestUrl, namespaces, lang) {
    const manifest = await loadJSON(manifestUrl);
    const base = new URL(manifestUrl, location.origin);
    const urls = (namespaces || [])
      .map((ns) => manifest[`${ns}.${lang}`])
      .filter(Boolean)
      .map((rel) => new URL(rel, base).toString());
    const parts = await Promise.all(
      urls.map((u) => fetch(u, { cache: "no-store" }).then((r) => r.json()))
    );
    return Object.assign({}, ...parts);
  }

  async function loadAndApply(lang) {
    state.lang = lang === "fr" ? "fr" : "en";
    localStorage.setItem(STORE_KEY, state.lang);
    const { manifestUrl, namespaces, observeMutations } = state.opts;

    // Always load the catalog for the current lang (including EN),
    // so switching back to EN restores strings without reload.
    const tmap = await loadCatalogs(manifestUrl, namespaces, state.lang);
    state.catalogs = tmap;
    applyAll(tmap);

    if (observeMutations) {
      if (state.observer) state.observer.disconnect();
      state.observer = new MutationObserver(() => applyAll(state.catalogs));
      state.observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  async function init(opts) {
    state.opts = Object.assign(
      { namespaces: ["profile"], observeMutations: true },
      opts || {}
    );
    const initial = (localStorage.getItem(STORE_KEY) || "en").toLowerCase();
    await loadAndApply(initial);
    // Also react to cross-tab changes
    window.addEventListener("storage", (e) => {
      if (e.key === STORE_KEY && e.newValue && e.newValue !== state.lang) {
        loadAndApply(e.newValue);
      }
    });
  }

  // Public API
  async function setLangNoReload(next) {
    await loadAndApply(next);
  }
  function t(key) {
    return state.catalogs[key] ?? key;
  }
  function fmtNumber(n, o) {
    return new Intl.NumberFormat(
      state.lang === "fr" ? "fr-CA" : "en-CA",
      o
    ).format(n);
  }
  function fmtDate(d, o) {
    const dt = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat(
      state.lang === "fr" ? "fr-CA" : "en-CA",
      o
    ).format(dt);
  }

  window.ThriveI18n = { init, setLangNoReload, t, fmtNumber, fmtDate };
})();
