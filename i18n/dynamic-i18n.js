// dynamic-i18n.js (single file, page-scoped renders, no MutationObserver)
(() => {
  // ---------------- Shared helpers ----------------
  function getLocale() {
    try {
      const v = (localStorage.getItem("preferredLang") || "en").toLowerCase();
      return v === "fr" ? "fr" : "en";
    } catch {
      return "en";
    }
  }

  // Parsers
  function parseRangeLabel(text) {
    const m = String(text)
      .trim()
      .match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) return null;
    const [, start, end, total] = m.map(Number);
    return { start, end, total };
  }
  function parseLastJoined(text) {
    const m = String(text)
      .trim()
      .match(/(\d+)\s+(day|days|month|months|year|years)/i);
    if (!m) return null;
    const n = Number(m[1]);
    const w = m[2].toLowerCase();
    const unitKey = w.startsWith("day")
      ? "day"
      : w.startsWith("month")
      ? "month"
      : "year";
    return { n, unitKey };
  }

  // Localized pieces
  const templates = {
    contacts: {
      en: ({ start, end, total }) => `Showing ${start} to ${end} of ${total}`,
      fr: ({ start, end, total }) =>
        `Affichage des éléments ${start} à ${end} sur ${total}`,
    },
    lastJoined: {
      en: ({ n, unit }) => `last person joined ${n} ${unit} ago`,
      fr: ({ n, unit }) => `dernière personne inscrite il y a ${n} ${unit}`,
    },
  };
  const UNITS = {
    en: {
      day: (n) => (n === 1 ? "day" : "days"),
      month: (n) => (n === 1 ? "month" : "months"),
      year: (n) => (n === 1 ? "year" : "years"),
    },
    fr: {
      day: (n) => (n === 1 ? "jour" : "jours"),
      month: () => "mois",
      year: (n) => (n === 1 ? "an" : "ans"),
    },
  };

  // ---------------- Page registry ----------------
  const PAGES = new Map(); // path -> render function

  function register(path, renderFn) {
    PAGES.set(path.replace(/\/+$/, ""), renderFn);
  }

  function activeRender() {
    const path = location.pathname.replace(/\/+$/, "");
    return PAGES.get(path);
  }

  function init() {
    const renderFn = activeRender();
    if (renderFn) renderFn();
  }

  // ---------------- Page: /profile/connections/contacts ----------------
  register("/profile/connections/contacts", function renderContacts() {
    const sel = "[id$='FindContacts_ShowingLabel']";
    const el = document.querySelector(sel);
    if (!el) return;

    const data = parseRangeLabel(el.textContent);
    if (!data) return;

    const loc = getLocale();
    const t = templates.contacts[loc] || templates.contacts.en;
    const next = t(data);
    if (el.textContent !== next) el.textContent = next;
  });

  // ---------------- Page: /profile/connections/communitiesnode ----------------
  register(
    "/profile/connections/communitiesnode",
    function renderCommunitiesNode() {
      const sel = "[id^='MainCopy_ctl29_lstCommunityList_lblLastUpdated_']";
      const loc = getLocale();
      const unitFn = UNITS[loc] || UNITS.en;
      const fmt = templates.lastJoined[loc] || templates.lastJoined.en;

      document.querySelectorAll(sel).forEach((el) => {
        const data = parseLastJoined(el.textContent);
        if (!data) return;
        const unit = unitFn[data.unitKey](data.n);
        const next = fmt({ n: data.n, unit });
        if (el.textContent !== next) el.textContent = next;
      });
    }
  );

  // ---------------- Boot + language toggle wiring ----------------
  // DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // Re-render the active page when the user toggles language
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-toggle-lang]");
    if (!link) return;
    e.preventDefault();

    const lang = (link.getAttribute("data-toggle-lang") || "").toLowerCase();
    try {
      localStorage.setItem("preferredLang", lang === "fr" ? "fr" : "en");
    } catch {}

    const renderFn = activeRender();
    if (renderFn) renderFn();
  });
})();

// (() => {
//   // Only run on this page
//   if (location.pathname.replace(/\/+$/, "") !== "/profile/connections/contacts")
//     return;

//   const TARGET = "[id$='FindContacts_ShowingLabel']";

//   // --- locale helpers ---
//   function getLocale() {
//     try {
//       const v = (
//         localStorage.getItem("preferredLang") ||
//         document.documentElement.getAttribute("lang") ||
//         "en"
//       ).toLowerCase();
//       return v === "fr" ? "fr" : "en";
//     } catch {
//       return "en";
//     }
//   }

//   const templates = {
//     en: ({ start, end, total }) => `Showing ${start} to ${end} of ${total}`,
//     fr: ({ start, end, total }) =>
//       `Affichage des éléments ${start} à ${end} sur ${total}`,
//   };

//   function parseRangeLabel(text) {
//     const m = String(text)
//       .trim()
//       .match(/(\d+)\D+(\d+)\D+(\d+)/);
//     if (!m) return null;
//     const [, start, end, total] = m.map(Number);
//     return { start, end, total };
//   }

//   function render() {
//     const el = document.querySelector(TARGET);
//     console.log("render ->", el);
//     if (!el) return;

//     const data = parseRangeLabel(el.textContent);
//     if (!data) return; // leave as-is if pattern doesn't match

//     const loc = getLocale();
//     const t = templates[loc] || templates.en; // fixed fallback
//     const next = t(data);
//     if (el.textContent !== next) el.textContent = next;
//   }

//   function init() {
//     // sync html@lang to stored value and render once
//     // setLocale(getLocale());
//     render();
//   }

//   // If this <script> is not `defer`, wait for DOM
//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", init, { once: true });
//   } else {
//     init();
//   }

//   // --- react to user toggles ---
//   // Works with: <a href="#" data-toggle-lang="fr"> / data-toggle-lang="en"
//   document.addEventListener("click", (e) => {
//     const link = e.target.closest("[data-toggle-lang]");
//     if (!link) return;
//     e.preventDefault();

//     render();
//   });
// })();
