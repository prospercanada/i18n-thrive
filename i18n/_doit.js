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

// Re-run bootstrap + apply current language (idempotent)
// webforms
async function reI18n() {
  try {
    await ThriveI18nBootstrap({
      manifestUrl:
        "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
      namespaces: ["profile"], // add more if you load more
    });
    const lang =
      ThriveI18n.__debug?.().lang ||
      localStorage.getItem("preferredLang") ||
      "en";
    await ThriveI18n.setLangNoReload(lang);
    dbg("reI18n applied", { lang });
  } catch (e) {
    console.error("[i18n] reI18n error", e);
  }
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

// webforms
document.addEventListener("DOMContentLoaded", async () => {
  // 1) Attach hooks from map(s)
  await ThriveI18nBootstrap({
    manifestUrl:
      "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
    namespaces: ["profile"],
    onlyIf: isPeoplePage,
  });

  // 2) Init translations
  await ThriveI18n.init({
    manifestUrl:
      "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
    namespaces: ["profile"],
    observeMutations: true, // re-apply to new nodes, once hooks exist
  });

  // 3) Hook WebForms partial postbacks (UpdatePanel)
  try {
    if (window.Sys?.WebForms?.PageRequestManager) {
      const prm = Sys.WebForms.PageRequestManager.getInstance();
      // after every async postback, re-attach hooks and re-apply language
      prm.add_endRequest(function () {
        dbg("endRequest — re-i18n");
        // give WF a tick to finish DOM swaps
        setTimeout(reI18n, 0);
      });
      dbg("PageRequestManager hook installed");
    } else {
      dbg("PageRequestManager not found (no UpdatePanel?)");
    }
  } catch (e) {
    console.warn("[i18n] PRM hook failed", e);
  }

  // 4) Optional fallback: catch other dynamic swaps
  let t = null;
  const mo = new MutationObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => {
      // Lightweight: just re-apply current lang (hooks stick if already attached)
      const lang = ThriveI18n.__debug?.().lang || "en";
      ThriveI18n.setLangNoReload(lang);
    }, 150);
  });
  mo.observe(document.body, { childList: true, subtree: true });
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
    dbg("toggled", next); // webforms
  } catch (err) {
    console.error("[i18n] toggle error", err);
  }
});
