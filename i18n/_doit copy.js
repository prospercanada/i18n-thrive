const dbg = (m, o) => console.log("[i18n]", m, o ?? "");

// NEW BEGIN
function pickNamespaces(pathname) {
  if (/^\/profile\/connections(\/|$)/.test(pathname)) return ["connections"];
  if (
    /^\/profile(\/|$)/.test(pathname) ||
    /^\/people\/[^/]+\/?$/.test(pathname)
  )
    return ["profile"];
  return []; // other pages: no i18n
}

function installWebFormsHooks() {
  let installed = false;

  function wire() {
    if (installed) return true;
    if (window.Sys?.WebForms?.PageRequestManager) {
      const prm = Sys.WebForms.PageRequestManager.getInstance();
      prm.add_endRequest(() => setTimeout(reI18n, 0));
      window.Sys?.Application?.add_load?.(() => setTimeout(reI18n, 0));
      installed = true;
      dbg("WebForms PRM hook installed");
      return true;
    }
    return false;
  }

  if (wire()) return;

  const iv = setInterval(() => {
    if (wire()) clearInterval(iv);
  }, 200);
  setTimeout(() => clearInterval(iv), 8000);

  if (typeof window.__doPostBack === "function") {
    const orig = window.__doPostBack;
    window.__doPostBack = function () {
      const r = orig.apply(this, arguments);
      setTimeout(reI18n, 0);
      return r;
    };
    dbg("Fallback __doPostBack patch installed");
  }
}

async function initI18n() {
  const namespaces = pickNamespaces(location.pathname);
  if (!namespaces.length) return; // skip pages without translations

  const I18N_OPTS = {
    manifestUrl:
      "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
    namespaces,
  };

  await ThriveI18nBootstrap(I18N_OPTS);
  await ThriveI18n.init({ ...I18N_OPTS, observeMutations: true });

  // 3. Install WebForms hooks (call once)
  installWebFormsHooks();
}

document.addEventListener("DOMContentLoaded", initI18n);
// NEW END

// 5) language toggle
document.addEventListener("click", async (e) => {
  const a = e.target.closest("[data-toggle-lang]");
  if (!a) return;
  e.preventDefault();
  const next = a.getAttribute("data-toggle-lang"); // "en" | "fr"
  try {
    await ThriveI18n.setLangNoReload(next);
    document.documentElement.setAttribute("lang", next);
    dbg("toggled", next);
  } catch (err) {
    console.error("[i18n] toggle error", err);
  }
});
