// dynamic-i18n.js
(function (global) {
  const PAGES = new Map(); // path/pattern -> handler fn(s)
  const once = (fn) => {
    let ran = false;
    return (...a) => {
      if (!ran) {
        ran = true;
        fn(...a);
      }
    };
  };

  const LOCALE = (document.documentElement.lang || "en-CA").toLowerCase();
  const templates = {
    "en-ca": { rangeTotal: ({ s, e, t }) => `Showing ${s} to ${e} of ${t}` },
    "fr-ca": {
      rangeTotal: ({ s, e, t }) =>
        `Affichage des éléments ${s} à ${e} sur ${t}`,
    },
  };

  function parseRangeTotal(text) {
    const m = text.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) return null;
    const [, s, e, t] = m.map(Number);
    return { s, e, t };
  }

  function formatRangeLabel(node) {
    const data = parseRangeTotal(node.textContent.trim());
    if (!data) return;
    const t = templates[LOCALE]?.rangeTotal || templates["en-ca"].rangeTotal;
    node.textContent = t(data);
  }

  function onContactsPage() {
    const sel = "[id$='FindContacts_ShowingLabel']";
    const apply = () =>
      document.querySelectorAll(sel).forEach(formatRangeLabel);
    apply();

    // minimal observer for partial updates
    let timer;
    const mo = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(apply, 80);
    });
    mo.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  }

  // --- public API ---
  function register(pathOrRegex, handler) {
    PAGES.set(pathOrRegex, (PAGES.get(pathOrRegex) || []).concat(handler));
  }

  function init() {
    const path = location.pathname.replace(/\/+$/, "");
    for (const [key, handlers] of PAGES.entries()) {
      const match =
        typeof key === "string"
          ? key === path
          : key instanceof RegExp
          ? key.test(path)
          : false;
      if (match) handlers.forEach((h) => h());
    }
  }

  global.DynamicI18n = { register, init, _helpers: { formatRangeLabel } };

  // Register built-ins here or in a separate bootstrap file:
  register("/profile/connections/contacts", onContactsPage);

  // Auto-init on DOM ready
  document.readyState !== "loading"
    ? init()
    : document.addEventListener("DOMContentLoaded", once(init));
})(window);
