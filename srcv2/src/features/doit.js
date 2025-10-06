// src/features/doit.js
// Utilities + WebForms hooks for Thrive i18n. No side effects on import.

const dbg = (m, o) => console.log("[i18n]", m, o ?? "");

// ----- optional helpers still used elsewhere -----
export function formatCount(keyBase, count) {
  const k = count === 1 ? `${keyBase}.one` : `${keyBase}.other`;
  const tpl =
    window.ThriveI18n?.t?.(k) ||
    window.ThriveI18n?.t?.(`${keyBase}.other`) ||
    "{count}";
  return String(tpl).replace("{count}", String(count));
}
export function updateCountAt(selector, keyBase) {
  const el = document.querySelector(selector);
  if (!el) return;
  const m = (el.textContent || "").match(/\d+/);
  if (!m) return;
  const n = parseInt(m[0], 10);
  el.textContent = formatCount(keyBase, n);
}

// ----- internal url helpers -----
function getParamCI(url, name) {
  const target = name.toLowerCase();
  for (const [k, v] of url.searchParams.entries()) {
    if (k.toLowerCase() === target) return v;
  }
  return null;
}

/**
 * Decide which namespaces to load based on the current path + query.
 * Keep this as your single routing table.
 */
export function pickNamespaces(currentUrlOrPath = location.href) {
  const url =
    typeof currentUrlOrPath === "string"
      ? new URL(currentUrlOrPath, location.origin)
      : currentUrlOrPath instanceof URL
      ? currentUrlOrPath
      : new URL(location.href);

  const rawPath = (url.pathname || "/").replace(/\/{2,}/g, "/");
  const path = rawPath.replace(/^\/sandboxmicrosite(?=\/|$)/i, "") || "/";
  const section = (getParamCI(url, "section") || "").trim().toLowerCase();

  // Header/footer are cheap and ubiquitous
  const out = new Set(["header", "footer"]);

  const add = (ns) => {
    if (!ns) return;
    (Array.isArray(ns) ? ns : [ns]).forEach((n) => n && out.add(n));
  };

  // Profile-ish
  if (/^\/profile(?:\/|$)/i.test(path) || /^\/people(?:\/|$)/i.test(path))
    add("profile");
  if (/^\/profile\/connections\/contacts(?:\/|$)/i.test(path))
    add("connections");
  if (/^\/profile\/connections\/communities(?:\/|$)/i.test(path))
    add("communities");
  if (/^\/profile\/connections\/communitiesnode(?:\/|$)/i.test(path))
    add("communitiesNode");
  if (/^\/profile\/connections\/following-connections(?:\/|$)/i.test(path))
    add("following");

  if (/^\/profile\/contributions\/contributions-summary(?:\/|$)/i.test(path))
    add("contribSummary");
  if (
    /^\/profile\/contributions\/contributions-achievements(?:\/|$)/i.test(path)
  )
    add("contribAchievements");
  if (/^\/profile\/contributions\/contributions-list(?:\/|$)/i.test(path))
    add("contribList");

  if (/^\/profile\/myaccount\/changepassword(?:\/|$)/i.test(path))
    add("accountChangePassword");
  if (/^\/profile\/myaccount\/mysignature(?:\/|$)/i.test(path))
    add("accountSignature");
  if (/^\/profile\/myaccount\/inbox(?:\/|$)/i.test(path)) add("accountInbox");
  if (/^\/profile\/myaccount\/my-settings(?:\/|$)/i.test(path)) {
    const map = {
      privacy: "accountSettingsPrivacy",
      email: "accountSettingsEmail",
      rssfeeds: "accountSettingsRss",
      subscriptions: "accountSettingsSubscriptions",
    };
    add(map[section]);
  }

  // Directory
  if (/^\/network\/members(?:\/|$)/i.test(path)) add("networkMembers");

  // Top-level statics
  if (/^\/contactus(?:\/|$)/i.test(path)) add("contactus");
  if (/^\/login(?:\/|$)/i.test(path)) add("login");
  if (/^\/participate\/postmessage(?:\/|$)/i.test(path)) add("postMessage");
  if (/^\/participate\/add-new-entry(?:\/|$)/i.test(path)) add("addLibrary");
  if (/^\/events\/calendar(?:\/|$)/i.test(path)) add("eventsCalendar");

  // Communities
  if (/^\/communities\/[^/]+(?:\/|$)/i.test(path)) add("community");
  const inviteRe =
    /^\/communities(?:\/community-home)?\/invite-community(?:\/digestviewer)?(?:\/|$)/i;
  if (inviteRe.test(path)) add("communityInvite");
  if (/^\/communities\/community-home\/digestviewer(?:\/|$)/i.test(path))
    add("communityDigest");
  if (/^\/communities\/community-home\/librarydocuments(?:\/|$)/i.test(path))
    add("communityLibrary");
  if (
    /^\/communities\/community-home\/recent-community-events(?:\/|$)/i.test(
      path
    )
  )
    add("communityEvents");
  if (/^\/communities\/community-home\/community-members(?:\/|$)/i.test(path))
    add("communityMembers");

  return Array.from(out);
}

/**
 * Install PRM / __doPostBack hooks once.
 * On partial updates, we just re-apply the current language.
 * The i18n module’s MutationObserver will (re)tag and (re)apply in changed subtrees.
 */
export function installWebFormsHooks() {
  let installed = false;

  const reapply = () => {
    const lang =
      window.ThriveI18n?.__debug?.().lang ||
      document.documentElement.getAttribute("data-lang") ||
      localStorage.getItem("preferredLang") ||
      "en";
    // Re-apply translations for current lang (maps + catalogs are already cached)
    window.ThriveI18n?.setLangNoReload?.(lang);
    dbg("re-applied after partial postback", { lang });
  };

  function wire() {
    if (installed) return true;
    if (window.Sys?.WebForms?.PageRequestManager) {
      const prm = window.Sys.WebForms.PageRequestManager.getInstance();
      prm.add_endRequest(() => setTimeout(reapply, 0));
      window.Sys?.Application?.add_load?.(() => setTimeout(reapply, 0));
      installed = true;
      dbg("WebForms PRM hook installed");
      return true;
    }
    return false;
  }

  if (wire()) return;

  // Retry briefly until PRM shows up
  const iv = setInterval(() => {
    if (wire()) clearInterval(iv);
  }, 200);
  setTimeout(() => clearInterval(iv), 8000);

  // Fallback for older pages
  if (typeof window.__doPostBack === "function") {
    const orig = window.__doPostBack;
    window.__doPostBack = function () {
      const r = orig.apply(this, arguments);
      setTimeout(reapply, 0);
      dbg("Fallback __doPostBack patch used");
      return r;
    };
  }
}

/**
 * Convenience boot: compute namespaces, init i18n, set initial lang, and hook WebForms.
 * Call this from your orchestrator on DOM ready.
 */
export async function initDoIt({ manifestUrl }) {
  const namespaces = pickNamespaces(new URL(location.href));
  if (!namespaces.length) {
    dbg("skip i18n (no namespaces for this page)");
    return;
  }

  // Initialize i18n core (it handles both maps and catalogs + a MutationObserver)
  await window.ThriveI18n?.init?.({
    manifestUrl,
    namespaces,
    observeMutations: true,
  });

  const initial = (
    localStorage.getItem("preferredLang") ||
    document.documentElement.getAttribute("data-lang") ||
    document.documentElement.getAttribute("lang") ||
    "en"
  ).toLowerCase();

  await window.ThriveI18n?.setLangNoReload?.(initial);
  document.documentElement.setAttribute(
    "data-lang",
    initial === "fr" ? "fr" : "en"
  );
  document.documentElement.setAttribute(
    "lang",
    initial === "fr" ? "fr-CA" : "en-CA"
  );
  dbg("initDoIt complete", { initial, namespaces });

  installWebFormsHooks();
}
