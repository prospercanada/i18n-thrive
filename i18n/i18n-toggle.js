(() => {
  const LANG_STORAGE_KEY = "preferredLang";
  const languages = [
    { code: "en", label: "English", htmlLang: "en-CA" },
    { code: "fr", label: "Français", htmlLang: "fr-CA" },
  ];

  // --- helpers ---
  const normalize = (v) =>
    String(v || "en").toLowerCase() === "fr" ? "fr" : "en";

  function getCurrentLang() {
    try {
      return normalize(localStorage.getItem(LANG_STORAGE_KEY));
    } catch {
      return "en";
    }
  }

  function setDocumentLang(lang) {
    const code = normalize(lang);
    // 🟨 set BOTH attributes so CSS + a11y stay in sync
    document.documentElement.setAttribute("data-lang", code);
    document.documentElement.setAttribute(
      "lang",
      code === "fr" ? "fr-CA" : "en-CA"
    );
  }

  async function updateLanguage(lang) {
    const next = normalize(lang);

    // Early exit if unchanged (still notify if you want renderers to re-run)
    const current = document.documentElement.getAttribute("data-lang") || "en";
    if (current === next) {
      window.dispatchEvent(
        new CustomEvent("langchange", { detail: { lang: next } })
      );
      return;
    }

    // Persist + update <html> attrs
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {}
    setDocumentLang(next); // 🟨 centralize attr updates

    // Optional: static i18n swap without reload
    if (window.ThriveI18n?.setLangNoReload) {
      try {
        await window.ThriveI18n.setLangNoReload(next);
      } catch (err) {
        console.error("[i18n] setLangNoReload failed:", err);
      }
    }

    // Optional block toggling (keep only if you use data-lang-content)
    // document.querySelectorAll("[data-lang-content]").forEach((el) => {
    //   const show = (el.dataset.langContent || "").toLowerCase() === next;
    //   el.style.display = show ? "" : "none";
    // });

    // Notify renderers/widgets
    window.dispatchEvent(
      new CustomEvent("langchange", { detail: { lang: next } })
    );
  }

  // --- toggle UI ---
  function addLanguageToggle(currentLang) {
    const navBar = document.querySelector(".nav.navbar-nav");
    if (!navBar) return;

    // Idempotent: remove any previous toggle we added
    navBar
      .querySelectorAll("li[data-lang-toggle]")
      .forEach((li) => li.remove());

    // Show only the non-selected language
    const other = languages.find((l) => l.code !== currentLang);
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
    navBar.appendChild(li);

    if (!navBar.dataset.langToggleBound) {
      navBar.addEventListener("click", (e) => {
        const target = e.target.closest("[data-toggle-lang]");
        if (!target) return;
        e.preventDefault();
        const lang = target.dataset.toggleLang;
        updateLanguage(lang);
        addLanguageToggle(lang); // rebuild to show the *other* choice
      });
      navBar.dataset.langToggleBound = "1";
    }
  }

  // --- boot ---
  async function init() {
    const current = getCurrentLang();
    // 🟨 use updateLanguage so everything (attrs, storage, event) is consistent at boot
    await updateLanguage(current);
    addLanguageToggle(current);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // Example: elsewhere you can react to language changes
  // window.addEventListener("langchange", () => {
  //   const render = window.DynamicI18n?.activeRender?.();
  //   render && render();
  // });
})();

// (() => {
//   const LANG_STORAGE_KEY = "preferredLang";
//   const languages = [
//     { code: "en", label: "English", htmlLang: "en-CA" },
//     { code: "fr", label: "Français", htmlLang: "fr-CA" },
//   ];

//   // --- helpers ---
//   const normalize = (v) =>
//     String(v || "en").toLowerCase() === "fr" ? "fr" : "en";
//   function getCurrentLang() {
//     try {
//       return normalize(localStorage.getItem(LANG_STORAGE_KEY));
//     } catch {
//       return "en";
//     }
//   }
//   function setDocumentLang(lang) {
//     // keep <html lang> useful for a11y/other scripts
//     document.documentElement.setAttribute(
//       "lang",
//       lang === "fr" ? "fr-CA" : "en-CA"
//     );
//   }

//   async function updateLanguage(lang) {
//     const next = String(lang).toLowerCase() === "fr" ? "fr" : "en";

//     // Early exit if unchanged
//     const current = document.documentElement.getAttribute("data-lang") || "en";
//     if (current === next) {
//       // Still notify listeners if you want them to re-render anyway:
//       window.dispatchEvent(
//         new CustomEvent("langchange", { detail: { lang: next } })
//       );
//       return;
//     }

//     // Persist + update <html> attributes
//     try {
//       localStorage.setItem("preferredLang", next);
//     } catch {}
//     document.documentElement.setAttribute("data-lang", next);
//     document.documentElement.setAttribute(
//       "lang",
//       next === "fr" ? "fr-CA" : "en-CA"
//     );

//     // Optional: run your static i18n swap without reload (non-blocking)
//     if (window.ThriveI18n?.setLangNoReload) {
//       try {
//         await window.ThriveI18n.setLangNoReload(next);
//       } catch (err) {
//         console.error("[i18n] setLangNoReload failed:", err);
//       }
//     }

//     // // Optional: toggle any explicit blocks marked with data-lang-content
//     // document.querySelectorAll("[data-lang-content]").forEach((el) => {
//     //   const show = (el.dataset.langContent || "").toLowerCase() === next;
//     //   // Use empty string to preserve natural display; otherwise hide.
//     //   el.style.display = show ? "" : "none";
//     // });

//     // Notify any listeners (dynamic i18n, date/number formatters, etc.)
//     window.dispatchEvent(
//       new CustomEvent("langchange", { detail: { lang: next } })
//     );
//   }

//   //   async function updateLanguage(lang) {
//   //     const next = String(lang).toLowerCase() === "fr" ? "fr" : "en";

//   //     try {
//   //       localStorage.setItem("preferredLang", next);
//   //     } catch {}
//   //     document.documentElement.setAttribute(
//   //       "lang",
//   //       next === "fr" ? "fr-CA" : "en-CA"
//   //     );

//   //     // (optional) keep if your static i18n needs to re-run without reload
//   //     if (window.ThriveI18n?.setLangNoReload) {
//   //       try {
//   //         await window.ThriveI18n.setLangNoReload(next);
//   //       } catch (err) {
//   //         console.error("[i18n] setLangNoReload failed:", err);
//   //       }
//   //     }

//   //     // Optional block toggling
//   //     document.querySelectorAll("[data-lang-content]").forEach((el) => {
//   //       el.style.display =
//   //         (el.dataset.langContent || "").toLowerCase() === next ? "" : "none";
//   //     });

//   //     // Notify page renderers/widgets
//   //     window.dispatchEvent(
//   //       new CustomEvent("langchange", { detail: { lang: next } })
//   //     );
//   //   }
//   //   function updateLanguage(lang) {
//   //     const next = normalize(lang);
//   //     try {
//   //       localStorage.setItem(LANG_STORAGE_KEY, next);
//   //     } catch {}
//   //     setDocumentLang(next);

//   //     // Optional: show/hide language-specific blocks
//   //     document.querySelectorAll("[data-lang-content]").forEach((el) => {
//   //       el.style.display =
//   //         (el.dataset.langContent || "").toLowerCase() === next ? "" : "none";
//   //     });

//   //     // Let other scripts (your per-page renderers) react
//   //     window.dispatchEvent(
//   //       new CustomEvent("langchange", { detail: { lang: next } })
//   //     );
//   //   }

//   // --- toggle UI ---
//   function addLanguageToggle(currentLang) {
//     const navBar = document.querySelector(".nav.navbar-nav");
//     if (!navBar) return;

//     // Remove previous toggle(s) we added (keeps this idempotent)
//     navBar
//       .querySelectorAll("li[data-lang-toggle]")
//       .forEach((li) => li.remove());

//     // Show only the non-selected language
//     const other = languages.find((l) => l.code !== currentLang);
//     if (!other) return;

//     const li = document.createElement("li");
//     li.setAttribute("data-lang-toggle", "true");

//     const a = document.createElement("a");
//     a.href = "#";
//     a.setAttribute("role", "button");
//     a.setAttribute("aria-label", `Switch to ${other.label}`);
//     a.dataset.toggleLang = other.code;
//     a.textContent = other.label;

//     li.appendChild(a);
//     navBar.appendChild(li);

//     // Ensure one click handler (delegate on the navbar)
//     if (!navBar.dataset.langToggleBound) {
//       navBar.addEventListener("click", (e) => {
//         const target = e.target.closest("[data-toggle-lang]");
//         if (!target) return;
//         e.preventDefault();
//         const lang = target.dataset.toggleLang;
//         updateLanguage(lang);
//         // Rebuild the toggle to now show the *other* language
//         addLanguageToggle(lang);
//       });
//       navBar.dataset.langToggleBound = "1";
//     }
//   }

//   // --- boot ---
//   function init() {
//     const current = getCurrentLang();
//     setDocumentLang(current);

//     // Optional: initialize [data-lang-content] visibility
//     document.querySelectorAll("[data-lang-content]").forEach((el) => {
//       el.style.display =
//         (el.dataset.langContent || "").toLowerCase() === current ? "" : "none";
//     });

//     addLanguageToggle(current);
//   }

//   // Give your dynamic i18n a hook to re-render on toggle
//   // Example:
//   //   window.addEventListener("langchange", () => {
//   //     const render = window.DynamicI18n?.activeRender?.();
//   //     render && render();
//   //   });

//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", init, { once: true });
//   } else {
//     init();
//   }
// })();
