const dbg = (m, o) => console.log("[i18n]", m, o ?? "");

// NEW START

// --- dynamic formatter helpers (reuse for any counters)

// function refreshSelectpicker(selector) {
//   try {
//     if (window.jQuery && jQuery.fn.selectpicker) {
//       jQuery(selector).selectpicker("refresh");
//     }
//   } catch (_) {}
// }

function formatCount(keyBase, count) {
  const k = count === 1 ? `${keyBase}.one` : `${keyBase}.other`;
  const tpl = ThriveI18n.t(k) || ThriveI18n.t(`${keyBase}.other`) || "{count}";
  return tpl.replace("{count}", String(count));
}
function updateCountAt(selector, keyBase) {
  const el = document.querySelector(selector);
  if (!el) return;
  const m = (el.textContent || "").match(/\d+/);
  if (!m) return;
  const n = parseInt(m[0], 10);
  el.textContent = formatCount(keyBase, n);
}

// --- page-specific extras
function runCommunitiesNodeExtras() {
  // counts like "0 total" → "{count} au total"
  console.log("runCommunitiesNodeExtras called");
  // updateCountAt(
  //   "#MainCopy_ctl29_lbCommunityCount .Count.text-muted",
  //   "communities.count"
  // );
}

// function runFollowingConnectionsExtras() {
//   // refresh the filter dropdown UI if Bootstrap-Select is active
//   refreshSelectpicker("[id^='FollowedContent_'][id$='-type-filter']");
// }

// Optional: add more pages later
const pageExtras = [
  {
    test: (p) => /^\/profile\/connections\/communitiesnode(?:\/|$)/.test(p),
    run: runCommunitiesNodeExtras,
  },
  // {
  //   test: (p) =>
  //     /^\/profile\/connections\/following-connections(?:\/|$)/.test(p),
  //   run: runFollowingConnectionsExtras,
  // },
];

// const pageExtras = [
//   {
//     test: (p) => /^\/profile\/connections\/communitiesnode(?:\/|$)/.test(p),
//     run: runCommunitiesNodeExtras,
//   },
// ];

function runExtrasForPath(pathname = location.pathname) {
  for (const { test, run } of pageExtras) {
    if (test(pathname)) {
      console.log("RUN FOR", pathname);
      run();
    }
  }
}
// NEW END

// function pickNamespaces(path) {
//   // always include base profile strings
//   const base = ["profile"];

//   // connections
//   if (/^\/profile\/connections\/contacts(?:\/|$)/.test(path))
//     return [...base, "connections"];
//   if (/^\/profile\/connections\/communitiesnode(?:\/|$)/.test(path))
//     return [...base, "communities"]; // <-- name your ns "communities"
//   if (/^\/profile\/connections\/following-connections(?:\/|$)/.test(path))
//     return [...base, "following"];

//   // contributions
//   if (/^\/profile\/contributions\/contributions-summary(?:\/|$)/.test(path))
//     return [...base, "contribSummary"];
//   if (
//     /^\/profile\/contributions\/contributions-achievements(?:\/|$)/.test(path)
//   )
//     return [...base, "contribAchievements"];
//   if (/^\/profile\/contributions\/contributions-list(?:\/|$)/.test(path))
//     return [...base, "contribList"];

//   // my account (use one ns per sub-section or a single "account" ns with keys grouped)
//   if (/^\/profile\/myaccount\/changepassword(?:\/|$)/.test(path))
//     return [...base, "accountChangePassword"];
//   if (/^\/profile\/myaccount\/mysignature(?:\/|$)/.test(path))
//     return [...base, "accountSignature"];
//   if (/^\/profile\/myaccount\/inbox(?:\/|$)/.test(path))
//     return [...base, "accountInbox"];

//   // settings with section=...
//   // if (/^\/profile\/myaccount\/my-settings(?:\/|$)/.test(path)) {
//   //   const sec = new URL(location.href).searchParams.get("section") || "";
//   //   console.log("XXX section is ", sec);
//   //   if (sec === "privacy") return [...base, "accountSettingsPrivacy"];
//   //   if (sec === "email") return [...base, "accountSettingsEmail"];
//   //   if (sec === "rssfeeds") return [...base, "accountSettingsRss"];
//   //   if (sec === "subscriptions")
//   //     return [...base, "accountSettingsSubscriptions"];
//   //   return [...base, "accountSettings"]; // default tab
//   // }

//   if (/^\/profile\/myaccount\/my-settings(?:\/|$)/.test(path)) {
//     const sec = new URL(location.href).searchParams.get("section") || "";
//     const key = sec.trim().toLowerCase();
//     // console.log("XXX section is ", key);
//     const map = {
//       privacy: "accountSettingsPrivacy",
//       email: "accountSettingsEmail",
//       rssfeeds: "accountSettingsRss",
//       subscriptions: "accountSettingsSubscriptions",
//     };

//     return [...base, map[key] || "accountSettings"]; // default tab
//   }

//   // the base profile page (bio, education, awards, etc.)
//   if (/^\/profile(?:\/|$)/.test(path)) return base;

//   if (/^\/network\/members(?:\/|$)/.test(path))
//     return [...base, "networkMembers"];
//   // others: no i18n
//   return [];
// }

function getParamCI(url, name) {
  // console.log("PARAM ", url, name);
  // case-insensitive query param getter
  const target = name.toLowerCase();
  for (const [k, v] of url.searchParams.entries()) {
    console.log("c ", k, v);
    if (k.toLowerCase() === target) return v;
  }
  return null;
}

function pickNamespaces(currentUrlOrPath) {
  // normalize to pathname and params
  const url =
    typeof currentUrlOrPath === "string"
      ? new URL(currentUrlOrPath, location.origin)
      : currentUrlOrPath instanceof URL
      ? currentUrlOrPath
      : new URL(location.href);

  // collapse duplicate slashes; ensure leading slash
  const rawPath = (url.pathname || "/").replace(/\/{2,}/g, "/");

  // Support microsite prefix
  const path = rawPath.replace(/^\/sandboxmicrosite(?=\/|$)/i, "") || "/";

  const section = (getParamCI(url, "section") || "").trim().toLowerCase();

  // base (no "profile" here)
  // const base = ["nav", "footer"];
  const base = ["header", "footer"];
  const out = new Set(base);

  // helper to add one or more ns
  const add = (ns) => {
    if (!ns) return;
    if (Array.isArray(ns)) ns.forEach((n) => n && out.add(n));
    else out.add(ns);
  };

  // Add "profile" only for /profile...
  if (/^\/profile(?:\/|$)/i.test(path)) out.add("profile");
  if (/^\/people(?:\/|$)/i.test(path)) out.add("profile");
  // connections
  if (/^\/profile\/connections\/contacts(?:\/|$)/i.test(path))
    add("connections");
  if (/^\/profile\/connections\/communities(?:\/|$)/i.test(path))
    add("communities");
  if (/^\/profile\/connections\/communitiesnode(?:\/|$)/i.test(path))
    add("communitiesNode");
  if (/^\/profile\/connections\/following-connections(?:\/|$)/i.test(path))
    add("following");

  // contributions
  if (/^\/profile\/contributions\/contributions-summary(?:\/|$)/i.test(path))
    add("contribSummary");
  if (
    /^\/profile\/contributions\/contributions-achievements(?:\/|$)/i.test(path)
  )
    add("contribAchievements");
  if (/^\/profile\/contributions\/contributions-list(?:\/|$)/i.test(path))
    add("contribList");

  // my account
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

  // directory
  if (/^\/network\/members(?:\/|$)/i.test(path)) add("networkMembers");

  // top-level static pages
  if (/^\/contactus(?:\/|$)/i.test(path)) add("contactus");
  if (/^\/login(?:\/|$)/i.test(path)) add("login");
  if (/^\/participate\/postmessage(?:\/|$)/i.test(path)) add("postMessage");
  if (/^\/participate\/add-new-entry(?:\/|$)/i.test(path)) add("addLibrary");
  if (/^\/events\/calendar(?:\/|$)/i.test(path)) add("eventsCalendar");

  // if (/^\/communities\/?$/i.test(path)) {
  //   out.add("community"); // or "communitiesTabs" if you prefer that name
  // }
  if (/^\/communities\/[^/]+(?:\/|$)/i.test(path)) {
    out.add("community");
  }

  // if (/^\/communities\/invite-community\/invite-community(?:\/|$)/i.test(path))
  //   out.add("communityInvite");

  const inviteRe =
    /^\/communities(?:\/community-home)?\/invite-community(?:\/digestviewer)?(?:\/|$)/i;
  if (inviteRe.test(path)) out.add("communityInvite");

  // if (/^\/communities\/community-home(?:\/|$)/i.test(path)) out.add("community");
  if (/^\/communities\/community-home\/digestviewer(?:\/|$)/i.test(path))
    out.add("communityDigest");

  if (/^\/communities\/community-home\/librarydocuments(?:\/|$)/i.test(path))
    out.add("communityLibrary");

  if (
    /^\/communities\/community-home\/recent-community-events(?:\/|$)/i.test(
      path
    )
  )
    out.add("communityEvents");

  if (/^\/communities\/community-home\/community-members(?:\/|$)/i.test(path))
    out.add("communityMembers");

  // if (/^\/communities\/community-home\/librarydocuments(?:\/|$)/i.test(path)) {
  //   out.add("communityLibrary");
  // }

  // if (
  //   /^\/communities\/community-home\/recent-community-events(?:\/|$)/i.test(
  //     path
  //   )
  // ) {
  //   out.add("communityEvents");
  // }

  // if (/^\/communities\/community-home\/community-members(?:\/|$)/i.test(path)) {
  //   out.add("communityMembers");
  // }
  // if (/^\/profile(?:\/|$)/i.test(path)) out.add("profile");
  // Always return the collected set (includes "profile" when applicable)
  return Array.from(out);
}

// function pickNamespaces(currentUrlOrPath) {
//   // normalize to pathname and params
//   const url =
//     typeof currentUrlOrPath === "string"
//       ? new URL(currentUrlOrPath, location.origin)
//       : currentUrlOrPath instanceof URL
//       ? currentUrlOrPath
//       : new URL(location.href);

//   // collapse duplicate slashes; ensure leading slash
//   const rawPath = (url.pathname || "/").replace(/\/{2,}/g, "/");

//   // 💡 Support the microsite prefix: /sandboxmicrosite/...
//   // If present, strip it so the rest of your regexes work unchanged.
//   const path = rawPath.replace(/^\/sandboxmicrosite(?=\/|$)/i, "") || "/";

//   const section = (getParamCI(url, "section") || "").trim().toLowerCase();
//   const base = ["nav", "profile", "footer"];

//   // connections
//   if (/^\/profile\/connections\/contacts(?:\/|$)/i.test(path))
//     return [...base, "connections"];
//   if (/^\/profile\/connections\/communities(?:\/|$)/i.test(path))
//     return [...base, "communities"];
//   if (/^\/profile\/connections\/communitiesnode(?:\/|$)/i.test(path))
//     return [...base, "communitiesNode"];
//   // console.log("PATH IS", path);
//   if (/^\/profile\/connections\/following-connections(?:\/|$)/i.test(path)) {
//     // console.log("PATH ", path);
//     return [...base, "following"];
//   }

//   // contributions
//   if (/^\/profile\/contributions\/contributions-summary(?:\/|$)/i.test(path))
//     return [...base, "contribSummary"];
//   if (
//     /^\/profile\/contributions\/contributions-achievements(?:\/|$)/i.test(path)
//   )
//     return [...base, "contribAchievements"];
//   if (/^\/profile\/contributions\/contributions-list(?:\/|$)/i.test(path))
//     return [...base, "contribList"];

//   // my account
//   if (/^\/profile\/myaccount\/changepassword(?:\/|$)/i.test(path))
//     return [...base, "accountChangePassword"];
//   if (/^\/profile\/myaccount\/mysignature(?:\/|$)/i.test(path))
//     return [...base, "accountSignature"];
//   if (/^\/profile\/myaccount\/inbox(?:\/|$)/i.test(path))
//     return [...base, "accountInbox"];

//   if (/^\/profile\/myaccount\/my-settings(?:\/|$)/i.test(path)) {
//     const map = {
//       privacy: "accountSettingsPrivacy",
//       email: "accountSettingsEmail",
//       rssfeeds: "accountSettingsRss",
//       subscriptions: "accountSettingsSubscriptions",
//     };
//     const specific = map[section];
//     return Array.from(new Set([...base, specific].filter(Boolean)));
//   }

//   // directory
//   if (/^\/network\/members(?:\/|$)/i.test(path))
//     return [...base, "networkMembers"];

//   // top-level static pages (add as needed)
//   if (/^\/contactus(?:\/|$)/i.test(path)) return [...base, "contactus"];
//   if (/^\/login(?:\/|$)/i.test(path)) return [...base, "login"];
//   if (/^\/participate\/postmessage(?:\/|$)/i.test(path))
//     return [...base, "postMessage"];
//   if (/^\/participate\/add-new-entry(?:\/|$)/i.test(path))
//     return [...base, "addLibrary"];
//   if (/^\/events\/calendar(?:\/|$)/i.test(path))
//     return [...base, "eventsCalendar"];

//   // base profile page (bio, education, awards, etc.)
//   if (/^\/profile(?:\/|$)/i.test(path)) return base;

//   // default: still include global bundles
//   return base;
// }

// function pickNamespaces(currentUrlOrPath) {
//   // normalize to pathname and params
//   const url =
//     typeof currentUrlOrPath === "string"
//       ? new URL(currentUrlOrPath, location.origin)
//       : currentUrlOrPath instanceof URL
//       ? currentUrlOrPath
//       : new URL(location.href);

//   // console.log("url ", url);
//   // collapse duplicate slashes; ensure leading slash
//   const path = (url.pathname || "/").replace(/\/{2,}/g, "/");
//   // const section = (url.searchParams.get("section") || "").trim().toLowerCase();
//   const section = (getParamCI(url, "section") || "").trim().toLowerCase();
//   const base = ["nav", "profile", "footer"];

//   // connections
//   if (/^\/profile\/connections\/contacts(?:\/|$)/i.test(path))
//     return [...base, "connections"];
//   if (/^\/profile\/connections\/communities(?:\/|$)/i.test(path))
//     return [...base, "communities"]; // was "communitiesnode"?
//   if (/^\/profile\/connections\/communitiesnode(?:\/|$)/i.test(path))
//     return [...base, "communitiesNode"];
//   if (/^\/profile\/connections\/following-connections(?:\/|$)/i.test(path))
//     return [...base, "following"];

//   // contributions
//   if (/^\/profile\/contributions\/contributions-summary(?:\/|$)/i.test(path))
//     return [...base, "contribSummary"];
//   if (
//     /^\/profile\/contributions\/contributions-achievements(?:\/|$)/i.test(path)
//   )
//     return [...base, "contribAchievements"];
//   if (/^\/profile\/contributions\/contributions-list(?:\/|$)/i.test(path))
//     return [...base, "contribList"];

//   // my account
//   if (/^\/profile\/myaccount\/changepassword(?:\/|$)/i.test(path))
//     return [...base, "accountChangePassword"];
//   if (/^\/profile\/myaccount\/mysignature(?:\/|$)/i.test(path))
//     return [...base, "accountSignature"];
//   if (/^\/profile\/myaccount\/inbox(?:\/|$)/i.test(path))
//     return [...base, "accountInbox"];

//   if (/^\/profile\/myaccount\/my-settings(?:\/|$)/i.test(path)) {
//     const map = {
//       privacy: "accountSettingsPrivacy",
//       email: "accountSettingsEmail",
//       rssfeeds: "accountSettingsRss",
//       subscriptions: "accountSettingsSubscriptions",
//     };
//     const specific = map[section];
//     // include both generic and specific (if present), and dedupe
//     return Array.from(new Set([...base, specific].filter(Boolean)));
//   }

//   // if (/^\/profile\/myaccount\/my-settings(?:\/|$)/i.test(path)) {
//   //   const map = {
//   //     privacy: "accountSettingsPrivacy",
//   //     email: "accountSettingsEmail",
//   //     rssfeeds: "accountSettingsRss",
//   //     subscriptions: "accountSettingsSubscriptions",
//   //   };
//   //   console.log("SECTION IS ", section);
//   //   return [...base, map[section] || "accountSettings"];
//   // }

//   // directory
//   if (/^\/network\/members(?:\/|$)/i.test(path))
//     return [...base, "networkMembers"];

//   // top-level static pages (add as needed)
//   if (/^\/contactus(?:\/|$)/i.test(path)) return [...base, "contactus"];
//   if (/^\/login(?:\/|$)/i.test(path)) return [...base, "login"];

//   if (/^\/participate\/postmessage(?:\/|$)/i.test(path)) {
//     return [...base, "postMessage"];
//   }
//   if (/^\/participate\/add-new-entry(?:\/|$)/i.test(path)) {
//     return [...base, "addLibrary"];
//   }
//   if (/^\/events\/calendar(?:\/|$)/i.test(path)) {
//     return [...base, "eventsCalendar"];
//   }

//   // if (/^\/termsandconditions(?:\/|$)/i.test(path)) return [...base, "terms"];
//   // if (/^\/home(?:\/|$)/i.test(path)) return [...base, "home"];

//   // base profile page (bio, education, awards, etc.)
//   if (/^\/profile(?:\/|$)/i.test(path)) return base;

//   // default: still include global bundles
//   return base;
// }

// 2) re-attach hooks + re-apply current lang (used after partial postbacks)
async function reI18n() {
  // console.log("reI18n pickNamespaces ", location.href);
  // const namespaces = pickNamespaces(location.pathname);
  const namespaces = pickNamespaces(new URL(location.href));
  if (!namespaces.length) return;

  const I18N_OPTS = {
    manifestUrl:
      "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
    namespaces,
  };

  try {
    // re-attach data-i18n/data-i18n-attr (idempotent)
    await ThriveI18nBootstrap(I18N_OPTS);

    // figure out current lang and re-apply
    const lang =
      ThriveI18n.__debug?.().lang ||
      localStorage.getItem("preferredLang") ||
      document.documentElement.getAttribute("lang") ||
      "en";

    console.log("setting lang 1 ", lang);
    await ThriveI18n.setLangNoReload(lang);
    document.documentElement.setAttribute("lang", lang);
    dbg("reI18n applied", { lang, namespaces });

    // ➜ run page-specific extras after partial postbacks
    runExtrasForPath();
  } catch (e) {
    console.error("[i18n] reI18n error", e);
  }
}

// 3) install WebForms hooks ONCE (retry until PRM exists; fallback to __doPostBack)
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

// 4) initial boot on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  dbg("DOMContentLoaded");
  // const namespaces = pickNamespaces(location.pathname);
  const namespaces = pickNamespaces(new URL(location.href));
  if (!namespaces.length) {
    dbg("skip i18n (no namespaces for this page)");
    return;
  }

  const I18N_OPTS = {
    manifestUrl:
      "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
    namespaces,
  };

  await ThriveI18nBootstrap(I18N_OPTS);
  await ThriveI18n.init({ ...I18N_OPTS, observeMutations: true });

  // set initial lang (persisted choice wins)
  const initial = (
    localStorage.getItem("preferredLang") ||
    document.documentElement.getAttribute("lang") ||
    "en"
  ).toLowerCase();
  await ThriveI18n.setLangNoReload(initial);
  console.log("setting lang 2 ", initial);
  document.documentElement.setAttribute("lang", initial);
  dbg("init complete", { initial, namespaces });

  // ➜ run page-specific extras on first paint
  runExtrasForPath();
  installWebFormsHooks(); // <-- call it once here
});

// Oct 6 REMOVED USER MAIN HANDLER
// // 5) (optional) language toggle
// document.addEventListener("click", async (e) => {
//   const a = e.target.closest("[data-toggle-lang]");
//   if (!a) return;
//   e.preventDefault();
//   const next = a.getAttribute("data-toggle-lang");
//   try {
//     localStorage.setItem("preferredLang", next);
//     await ThriveI18n.setLangNoReload(next);
//     document.documentElement.setAttribute("lang", next);
//     dbg("toggled", next);
//   } catch (err) {
//     console.error("[i18n] toggle error", err);
//   }
// });
