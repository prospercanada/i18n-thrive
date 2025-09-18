// --- globals (optional cosmetic hint if clicked early)
window.__i18nQueuedLang = null;

function isPeoplePage() {
  return (
    /^\/people\/[^/]+\/?$/.test(location.pathname) ||
    /^\/profile(?:\/|$)/.test(location.pathname)
  );
}
function dbg(msg, obj) {
  console.log("[i18n]", msg, obj ?? "");
}

document.addEventListener("DOMContentLoaded", async () => {
  await ThriveI18nBootstrap({
    manifestUrl:
      "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
    namespaces: ["profile"], // or ["profile","common"] etc.
    onlyIf: isPeoplePage,
  });

  // Then init translations
  await ThriveI18n.init({
    manifestUrl:
      "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
    namespaces: ["profile"],
    observeMutations: true,
  });
});

// Global language toggle
document.addEventListener("click", async (e) => {
  const a = e.target.closest("[data-toggle-lang]");
  if (!a) return;

  e.preventDefault();
  const next = a.getAttribute("data-toggle-lang"); // "en" or "fr"

  try {
    await ThriveI18n.setLangNoReload(next);
    document.documentElement.setAttribute("lang", next);
    console.log("[i18n] toggled to", next);
  } catch (err) {
    console.error("[i18n] toggle error", err);
  }
});
