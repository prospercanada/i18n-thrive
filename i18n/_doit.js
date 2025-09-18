function isPeoplePage() {
  return /^\/people\/[^/]+\/?$/.test(location.pathname);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (typeof window.ThriveI18nBootstrap === "function") {
      await window.ThriveI18nBootstrap({
        manifestUrl:
          "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
        namespaces: ["profile"],
        onlyIf: isPeoplePage,
      });
    }

    if (!isPeoplePage()) return;

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
