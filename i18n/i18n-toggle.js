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
    // keep <html lang> useful for a11y/other scripts
    document.documentElement.setAttribute(
      "lang",
      lang === "fr" ? "fr-CA" : "en-CA"
    );
  }

  async function updateLanguage(lang) {
    const next = String(lang).toLowerCase() === "fr" ? "fr" : "en";

    try {
      localStorage.setItem("preferredLang", next);
    } catch {}
    document.documentElement.setAttribute(
      "lang",
      next === "fr" ? "fr-CA" : "en-CA"
    );

    // (optional) keep if your static i18n needs to re-run without reload
    if (window.ThriveI18n?.setLangNoReload) {
      try {
        await window.ThriveI18n.setLangNoReload(next);
      } catch (err) {
        console.error("[i18n] setLangNoReload failed:", err);
      }
    }

    // Optional block toggling
    document.querySelectorAll("[data-lang-content]").forEach((el) => {
      el.style.display =
        (el.dataset.langContent || "").toLowerCase() === next ? "" : "none";
    });

    // Notify page renderers/widgets
    window.dispatchEvent(
      new CustomEvent("langchange", { detail: { lang: next } })
    );
  }
  //   function updateLanguage(lang) {
  //     const next = normalize(lang);
  //     try {
  //       localStorage.setItem(LANG_STORAGE_KEY, next);
  //     } catch {}
  //     setDocumentLang(next);

  //     // Optional: show/hide language-specific blocks
  //     document.querySelectorAll("[data-lang-content]").forEach((el) => {
  //       el.style.display =
  //         (el.dataset.langContent || "").toLowerCase() === next ? "" : "none";
  //     });

  //     // Let other scripts (your per-page renderers) react
  //     window.dispatchEvent(
  //       new CustomEvent("langchange", { detail: { lang: next } })
  //     );
  //   }

  // --- toggle UI ---
  function addLanguageToggle(currentLang) {
    const navBar = document.querySelector(".nav.navbar-nav");
    if (!navBar) return;

    // Remove previous toggle(s) we added (keeps this idempotent)
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

    // Ensure one click handler (delegate on the navbar)
    if (!navBar.dataset.langToggleBound) {
      navBar.addEventListener("click", (e) => {
        const target = e.target.closest("[data-toggle-lang]");
        if (!target) return;
        e.preventDefault();
        const lang = target.dataset.toggleLang;
        updateLanguage(lang);
        // Rebuild the toggle to now show the *other* language
        addLanguageToggle(lang);
      });
      navBar.dataset.langToggleBound = "1";
    }
  }

  // --- boot ---
  function init() {
    const current = getCurrentLang();
    setDocumentLang(current);

    // Optional: initialize [data-lang-content] visibility
    document.querySelectorAll("[data-lang-content]").forEach((el) => {
      el.style.display =
        (el.dataset.langContent || "").toLowerCase() === current ? "" : "none";
    });

    addLanguageToggle(current);
  }

  // Give your dynamic i18n a hook to re-render on toggle
  // Example:
  //   window.addEventListener("langchange", () => {
  //     const render = window.DynamicI18n?.activeRender?.();
  //     render && render();
  //   });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
