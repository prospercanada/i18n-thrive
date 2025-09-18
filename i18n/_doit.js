function isPeoplePage() {
  return /^\/people\/[^/]+\/?$/.test(location.pathname);
}

// Global toggle: switch language without reload
document.addEventListener("click", async (e) => {
  const a = e.target.closest("[data-toggle-lang]");
  if (!a) return;
  e.preventDefault();
  const next = a.getAttribute("data-toggle-lang"); // "en" or "fr"
  try {
    if (window.ThriveI18n?.setLangNoReload) {
      await window.ThriveI18n.setLangNoReload(next); // apply immediately
    } else {
      localStorage.setItem("preferredLang", next); // fallback
      location.reload();
    }
    // (optional if runtime already does it)
    document.documentElement.setAttribute("lang", next);
  } catch (err) {
    console.error("[i18n] toggle error:", err);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Attach data-i18n/data-i18n-attr from profile.map.json
    if (typeof window.ThriveI18nBootstrap === "function") {
      await window.ThriveI18nBootstrap({
        manifestUrl:
          "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
        namespaces: ["profile"],
        onlyIf: isPeoplePage,
        // optional robustness:
        // maxMs: 6000, intervalMs: 250
      });
    }

    if (!isPeoplePage()) return;

    // Initialize runtime (loads EN/FR catalogs and observes mutations)
    ThriveI18n.init({
      manifestUrl:
        "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
      namespaces: ["profile"],
      observeMutations: true,
    });
  } catch (e) {
    console.error("[i18n] init error:", e);
  }
});
