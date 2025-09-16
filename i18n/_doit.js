// TODO Add this a s a script and link to it in Thrive
// Run globally, but only translate on People pages (optional guard)
function isPeoplePage() {
  return /^\/people\/[^/]+\/?$/.test(location.pathname);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // a) Attach data-i18n attributes first (bootstrap sets them using profile.map.json)
    if (typeof window.ThriveI18nBootstrap === "function") {
      await window.ThriveI18nBootstrap({
        manifestUrl:
          "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
        // load any maps you have; safe if selectors don’t exist on this page
        namespaces: ["profile"],
        onlyIf: isPeoplePage, // comment out if you want truly global
      });
    }

    // b) Now initialize the runtime so FR applies (EN leaves the page as-is)
    if (!isPeoplePage()) return; // optional guard
    
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
