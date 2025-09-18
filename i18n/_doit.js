window.__i18nReady = false;
window.__i18nQueuedLang = null;


function isPeoplePage() {
  return /^\/people\/[^/]+\/?$/.test(location.pathname);
}

function dbg(label, obj) {
  const ts = new Date().toISOString().split("T")[1].replace("Z", "");
  console.log(`[i18n][${ts}] ${label}`, obj ?? "");
}

// Global toggle: switch language without reload
document.addEventListener("click", async (e) => {
  const a = e.target.closest("[data-toggle-lang]");
  if (!a) return;

  e.preventDefault();
  e.stopPropagation(); // extra safety (avoid form submits / other handlers)

  const next = a.getAttribute("data-toggle-lang"); // "en" | "fr"

  try {
    const api = window.ThriveI18n || window.i18n || (typeof ThriveI18n !== "undefined" && ThriveI18n);

    // ❌ OLD: reload fallback
    // localStorage.setItem("preferredLang", next); location.reload();

    // ✅ NEW: if not ready, queue and bail — no reload
    if (!api?.setLangNoReload || !window.__i18nReady) {
      window.__i18nQueuedLang = next;
      // (optional) visually show pending state
      document.documentElement.setAttribute("lang", next); // cosmetic
      return;
    }

    await api.setLangNoReload(next);
    document.documentElement.setAttribute("lang", next);
  } catch (err) {
    console.error("[i18n] toggle error:", err);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (typeof window.ThriveI18nBootstrap === "function") {
      await window.ThriveI18nBootstrap({
        manifestUrl: "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
        namespaces: ["profile"],
        onlyIf: isPeoplePage,
      });
    }

    if (isPeoplePage() && typeof ThriveI18n?.init === "function") {
      await ThriveI18n.init({
        manifestUrl: "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
        namespaces: ["profile"],
        observeMutations: true,
      });
    }

    // mark ready
    window.__i18nReady = true;

    // flush any queued click
    const pending = window.__i18nQueuedLang;
    if (pending && ThriveI18n?.setLangNoReload) {
      await ThriveI18n.setLangNoReload(pending);
      document.documentElement.setAttribute("lang", pending);
      window.__i18nQueuedLang = null;
    }

  } catch (e) {
    console.error("[i18n] init error:", e);
  }
});

