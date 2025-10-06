(() => {
  // Only run on this page
  if (location.pathname.replace(/\/+$/, "") !== "/profile/connections/contacts")
    return;

  const TARGET = "[id$='FindContacts_ShowingLabel']";

  // --- locale helpers ---
  function getLocale() {
    try {
      const v = (
        localStorage.getItem("preferredLang") ||
        document.documentElement.getAttribute("lang") ||
        "en"
      ).toLowerCase();
      return v === "fr" ? "fr" : "en";
    } catch {
      return "en";
    }
  }
  //   function setLocale(lang) {
  //     const v = (lang || "").toLowerCase() === "fr" ? "fr" : "en";
  //     try {
  //       localStorage.setItem("preferredLang", v);
  //     } catch {}
  //     document.documentElement.setAttribute(
  //       "lang",
  //       v === "fr" ? "fr-CA" : "en-CA"
  //     );
  //     return v;
  //   }

  const templates = {
    en: ({ start, end, total }) => `Showing ${start} to ${end} of ${total}`,
    fr: ({ start, end, total }) =>
      `Affichage des éléments ${start} à ${end} sur ${total}`,
  };

  function parseRangeLabel(text) {
    const m = String(text)
      .trim()
      .match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) return null;
    const [, start, end, total] = m.map(Number);
    return { start, end, total };
  }

  function render() {
    const el = document.querySelector(TARGET);
    console.log("render ->", el);
    if (!el) return;

    const data = parseRangeLabel(el.textContent);
    if (!data) return; // leave as-is if pattern doesn't match

    const loc = getLocale();
    const t = templates[loc] || templates.en; // fixed fallback
    const next = t(data);
    if (el.textContent !== next) el.textContent = next;
  }

  function init() {
    // sync html@lang to stored value and render once
    // setLocale(getLocale());
    render();
  }

  // If this <script> is not `defer`, wait for DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // --- react to user toggles ---
  // Works with: <a href="#" data-toggle-lang="fr"> / data-toggle-lang="en"
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-toggle-lang]");
    if (!link) return;
    e.preventDefault();

    // const lang = link.getAttribute("data-toggle-lang"); // "en" | "fr"
    // setLocale(lang);

    // (optional) UI state for toggles
    // document.querySelectorAll("[data-toggle-lang]").forEach((a) => {
    //   const active =
    //     a.getAttribute("data-toggle-lang") === (lang || "").toLowerCase();
    //   a.setAttribute("aria-pressed", String(active));
    //   a.classList.toggle("is-active", active);
    // });

    // Re-render page text in the new locale
    render();
  });
})();

// (() => {
//   // Only run on this page
//   if (location.pathname.replace(/\/+$/, "") !== "/profile/connections/contacts")
//     return;

//   // If this <script> is not `defer`, wait for DOM
//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", runOnce, { once: true });
//   } else {
//     runOnce();
//   }

//   function runOnce() {
//     const TARGET = "[id$='FindContacts_ShowingLabel']";
//     const el = document.querySelector(TARGET);

//     console.log("run once ", el);
//     if (!el) return;

//     // const LOCALE = (document.documentElement.lang || "en-CA").toLowerCase();
//     const LOCALE = (
//       localStorage.getItem("preferredLang") ||
//       document.documentElement.getAttribute("lang") ||
//       "en"
//     ).toLowerCase();
//     console.log("LOCALE ", LOCALE);
//     const templates = {
//       "en": ({ start, end, total }) =>
//         `Showing ${start} to ${end} of ${total}`,
//       "fr": ({ start, end, total }) =>
//         `Affichage des éléments ${start} à ${end} sur ${total}`,
//     };

//     const data = parseRangeLabel(el.textContent);
//     if (!data) return; // leave as-is if it doesn't match

//     const t = templates[LOCALE] || templates["en-ca"];
//     const next = t(data);

//     // Only write if different (safe & idempotent)
//     if (el.textContent !== next) el.textContent = next;
//   }

//   function parseRangeLabel(text) {
//     // Matches three numbers in order: start, end, total
//     // e.g., "Showing 1 to 5 of 5"
//     const m = String(text)
//       .trim()
//       .match(/(\d+)\D+(\d+)\D+(\d+)/);
//     if (!m) return null;
//     const [, start, end, total] = m.map(Number);
//     return { start, end, total };
//   }
// })();
