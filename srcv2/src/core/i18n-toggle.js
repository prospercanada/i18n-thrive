// src/core/i18n-toggle.js
let _inited = false;
const LANG_STORAGE_KEY = "preferredLang";
const LANGS = [
  { code: "en", label: "English", htmlLang: "en-CA" },
  { code: "fr", label: "Français", htmlLang: "fr-CA" },
];

const normalize = (v) =>
  String(v || "en").toLowerCase() === "fr" ? "fr" : "en";

export function getCurrentLang() {
  try {
    return normalize(localStorage.getItem(LANG_STORAGE_KEY));
  } catch {
    return "en";
  }
}

function setDocumentLang(code) {
  const c = normalize(code);
  document.documentElement.setAttribute("data-lang", c);
  document.documentElement.setAttribute("lang", c === "fr" ? "fr-CA" : "en-CA");
}

export async function setLanguage(lang, { notifyAlways = false } = {}) {
  const next = normalize(lang);
  const current = document.documentElement.getAttribute("data-lang") || "en";

  try {
    localStorage.setItem(LANG_STORAGE_KEY, next);
  } catch {}

  if (current !== next) setDocumentLang(next);

  // Update your DOM-tag translator first
  if (window.ThriveI18n?.setLangNoReload) {
    try {
      await window.ThriveI18n.setLangNoReload(next);
    } catch (err) {
      console.error("[i18n] setLangNoReload failed:", err);
    }
  }

  // NEW: i18next bridge (for React header/footer/body)
  if (window.i18next?.changeLanguage) {
    try {
      await window.i18next.changeLanguage(next);
    } catch (err) {
      console.warn("[i18n] i18next.changeLanguage failed:", err);
    }
  }

  if (notifyAlways || current !== next) {
    window.dispatchEvent(
      new CustomEvent("langchange", { detail: { lang: next } })
    );
  }
}

// ---------- DOM: toggle button ----------
function findNav() {
  return document.querySelector(".nav.navbar-nav");
}

function renderToggle(currentLang) {
  const nav = findNav();
  if (!nav) return;

  nav.querySelectorAll("li[data-lang-toggle]").forEach((li) => li.remove());

  const other = LANGS.find((l) => l.code !== currentLang);
  if (!other) return;

  const li = document.createElement("li");
  li.setAttribute("data-lang-toggle", "true");

  const a = document.createElement("a");
  a.href = "#";
  a.setAttribute("role", "button");
  a.setAttribute("aria-label", `Switch to ${other.label}`);
  a.dataset.toggleLang = other.code;
  a.textContent = other.label;

  li.appendChild(a);
  nav.appendChild(li);

  if (!nav.dataset.langToggleBound) {
    nav.addEventListener("click", (e) => {
      const target = e.target.closest("[data-toggle-lang]");
      if (!target) return;
      e.preventDefault();
      const lang = target.dataset.toggleLang;
      setLanguage(lang, { notifyAlways: true });
      renderToggle(lang);
    });
    nav.dataset.langToggleBound = "1";
  }
}

// observe DOM in case Thrive replaces the header/nav after partial updates
let _disconnectMo = null;
function startObserver() {
  if (_disconnectMo) return;
  const mo = new MutationObserver(() => {
    const nav = findNav();
    if (nav && !nav.querySelector("li[data-lang-toggle]")) {
      renderToggle(getCurrentLang());
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
  _disconnectMo = () => mo.disconnect();
}

// ---------- public init ----------
export function initToggle() {
  if (_inited) return;
  _inited = true;

  const current = getCurrentLang();
  setDocumentLang(current);

  // NEW: align React/i18next on first load too
  if (window.i18next?.changeLanguage) {
    window.i18next
      .changeLanguage(current)
      .catch((e) =>
        console.warn("[i18n] initial i18next.changeLanguage failed:", e)
      );
  }

  // Fire once so any dynamic listeners re-render
  window.dispatchEvent(
    new CustomEvent("langchange", { detail: { lang: current } })
  );

  const ready = () => {
    renderToggle(current);
    startObserver();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
}

// // src/core/i18n-toggle.js
// let _inited = false;
// const LANG_STORAGE_KEY = "preferredLang";
// const LANGS = [
//   { code: "en", label: "English", htmlLang: "en-CA" },
//   { code: "fr", label: "Français", htmlLang: "fr-CA" },
// ];

// // ---------- small utils ----------
// const normalize = (v) =>
//   String(v || "en").toLowerCase() === "fr" ? "fr" : "en";

// export function getCurrentLang() {
//   try {
//     return normalize(localStorage.getItem(LANG_STORAGE_KEY));
//   } catch {
//     return "en";
//   }
// }

// function setDocumentLang(code) {
//   const c = normalize(code);
//   document.documentElement.setAttribute("data-lang", c);
//   document.documentElement.setAttribute("lang", c === "fr" ? "fr-CA" : "en-CA");
// }

// export async function setLanguage(lang, { notifyAlways = false } = {}) {
//   const next = normalize(lang);
//   const current = document.documentElement.getAttribute("data-lang") || "en";

//   // persist
//   try {
//     localStorage.setItem(LANG_STORAGE_KEY, next);
//   } catch {}

//   if (current !== next) setDocumentLang(next);

//   // optional: if you have a no-reload renderer
//   if (window.ThriveI18n?.setLangNoReload) {
//     try {
//       await window.ThriveI18n.setLangNoReload(next);
//     } catch (err) {
//       console.error("[i18n] setLangNoReload failed:", err);
//     }
//   }

//   if (notifyAlways || current !== next) {
//     window.dispatchEvent(
//       new CustomEvent("langchange", { detail: { lang: next } })
//     );
//   }
// }

// // ---------- DOM: toggle button ----------
// function findNav() {
//   return document.querySelector(".nav.navbar-nav");
// }

// // create (or replace) the single toggle item
// function renderToggle(currentLang) {
//   const nav = findNav();
//   if (!nav) return;

//   // remove any previous toggles we added
//   nav.querySelectorAll("li[data-lang-toggle]").forEach((li) => li.remove());

//   const other = LANGS.find((l) => l.code !== currentLang);
//   if (!other) return;

//   const li = document.createElement("li");
//   li.setAttribute("data-lang-toggle", "true");

//   const a = document.createElement("a");
//   a.href = "#";
//   a.setAttribute("role", "button");
//   a.setAttribute("aria-label", `Switch to ${other.label}`);
//   a.dataset.toggleLang = other.code;
//   a.textContent = other.label;

//   li.appendChild(a);
//   nav.appendChild(li);

//   // one nav-level click handler (idempotent)
//   if (!nav.dataset.langToggleBound) {
//     nav.addEventListener("click", (e) => {
//       const target = e.target.closest("[data-toggle-lang]");
//       if (!target) return;
//       e.preventDefault();
//       const lang = target.dataset.toggleLang;
//       setLanguage(lang, { notifyAlways: true });
//       renderToggle(lang); // refresh to show the other choice
//     });
//     nav.dataset.langToggleBound = "1";
//   }
// }

// // observe DOM in case Thrive replaces the header/nav after partial updates
// let _disconnectMo = null;
// function startObserver() {
//   if (_disconnectMo) return;
//   const mo = new MutationObserver(() => {
//     // if nav exists but toggle is missing, re-render
//     const nav = findNav();
//     if (nav && !nav.querySelector("li[data-lang-toggle]")) {
//       renderToggle(getCurrentLang());
//     }
//   });
//   mo.observe(document.documentElement, { childList: true, subtree: true });
//   _disconnectMo = () => mo.disconnect();
// }

// // ---------- public init ----------
// export function initToggle() {
//   if (_inited) return;
//   _inited = true;

//   // set base lang (attrs + event) once on boot
//   const current = getCurrentLang();
//   setDocumentLang(current);
//   // notify others on boot (so dynamic renderers can run)
//   window.dispatchEvent(
//     new CustomEvent("langchange", { detail: { lang: current } })
//   );

//   // mount the toggle
//   const ready = () => {
//     renderToggle(current);
//     startObserver();
//   };
//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", ready, { once: true });
//   } else {
//     ready();
//   }
// }
