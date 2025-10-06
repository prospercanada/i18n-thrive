// dynamic-i18n.js (single file, page-scoped renders, no MutationObserver)
(() => {
  // ---------------- Shared helpers ----------------
  function getLocale() {
    try {
      const v = (localStorage.getItem("preferredLang") || "en").toLowerCase();
      return v === "fr" ? "fr" : "en";
    } catch {
      return "en";
    }
  }

  // Parsers

  // Shared helper
  function parseCommunityName(text) {
    // "Invite people to join the Sandbox Community community" -> "Sandbox Community"
    const m = String(text)
      .trim()
      .match(/^Invite people to join\s+(?:the\s+)?(.+?)(?:\s+community)?$/i);
    return m ? m[1].trim() : null;
  }

  function parseTotalCount(text) {
    const m = String(text).match(/(\d+)/);
    return m ? { total: Number(m[1]) } : null;
  }

  function parseRangeLabel(text) {
    const m = String(text)
      .trim()
      .match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) return null;
    const [, start, end, total] = m.map(Number);
    return { start, end, total };
  }
  function parseLastJoined(text) {
    const m = String(text)
      .trim()
      .match(/(\d+)\s+(day|days|month|months|year|years)/i);
    if (!m) return null;
    const n = Number(m[1]);
    const w = m[2].toLowerCase();
    const unitKey = w.startsWith("day")
      ? "day"
      : w.startsWith("month")
      ? "month"
      : "year";
    return { n, unitKey };
  }

  // Localized pieces
  const templates = {
    contacts: {
      en: ({ start, end, total }) => `Showing ${start} to ${end} of ${total}`,
      fr: ({ start, end, total }) =>
        `Affichage des éléments ${start} à ${end} sur ${total}`,
    },
    lastJoined: {
      en: ({ n, unit }) => `last person joined ${n} ${unit} ago`,
      fr: ({ n, unit }) => `dernière personne inscrite il y a ${n} ${unit}`,
    },
    totalCount: {
      en: ({ total }) => `${total} total`,
      fr: ({ total }) => `${total} au total`,
    },
    rangeWithTotal: {
      en: ({ start, end, total }) => `${start} to ${end} of ${total} total`,
      fr: ({ start, end, total }) => `${start} à ${end} sur ${total} au total`,
    },
  };

  const UNITS = {
    en: {
      day: (n) => (n === 1 ? "day" : "days"),
      month: (n) => (n === 1 ? "month" : "months"),
      year: (n) => (n === 1 ? "year" : "years"),
    },
    fr: {
      day: (n) => (n === 1 ? "jour" : "jours"),
      month: () => "mois",
      year: (n) => (n === 1 ? "an" : "ans"),
    },
  };

  // ---------------- Page registry ----------------
  const PAGES = new Map(); // path -> render function

  function register(path, renderFn) {
    PAGES.set(path.replace(/\/+$/, ""), renderFn);
  }

  function activeRender() {
    const path = location.pathname.replace(/\/+$/, "");
    return PAGES.get(path);
  }

  function init() {
    const renderFn = activeRender();
    if (renderFn) renderFn();
  }

  // /advisory-committee
  register("/advisory-committee", function renderAdvisoryCommitteeTitle() {
    const el = document.querySelector("#PageTitleH1");
    if (!el) return;

    const MAP = {
      en: "Meet the Resilient Futures Advisory Committee",
      fr: "Rencontrez le comité consultatif de l’initiative Un avenir résilient",
    };

    const loc = getLocale();
    const next = MAP[loc] || MAP.en;

    if (el.textContent.trim() !== next) el.textContent = next;
  });

  register(
    "/sandboxmicrosite/communities/community-home/invite-community",
    function renderInviteCommunity() {
      const sel = "#MainCopy_ctl04_InviteToCommunityLabel";
      const host = document.querySelector(sel);
      if (!host) return;

      // Prefer the inner <strong>, if present
      const target = host.querySelector("strong") || host;

      // Extract current name from whatever the platform rendered
      const name =
        parseCommunityName(target.textContent) || target.textContent.trim();

      const loc = getLocale(); // your existing helper returning "en" | "fr"
      const next =
        loc === "fr"
          ? `Invitez des personnes à rejoindre la communauté ${name}`
          : `Invite people to join ${name}`;

      if (target.textContent !== next) target.textContent = next;
    }
  );

  // ---------------- Page: /profile/connections/contacts ----------------
  register("/profile/connections/contacts", function renderContacts() {
    const sel = "[id$='FindContacts_ShowingLabel']";
    const el = document.querySelector(sel);
    if (!el) return;

    const data = parseRangeLabel(el.textContent);
    if (!data) return;

    const loc = getLocale();
    const t = templates.contacts[loc] || templates.contacts.en;
    const next = t(data);
    if (el.textContent !== next) el.textContent = next;
  });

  // ---------------- Page: /profile/connections/communitiesnode ----------------
  register(
    "/profile/connections/communitiesnode",
    function renderCommunitiesNode() {
      // A) “last person joined … ago”
      const loc = getLocale();
      const selLast = "[id^='MainCopy_ctl29_lstCommunityList_lblLastUpdated_']";
      const unitFn = UNITS[loc] || UNITS.en;
      const fmtLast = templates.lastJoined[loc] || templates.lastJoined.en;
      document.querySelectorAll(selLast).forEach((el) => {
        const data = parseLastJoined(el.textContent);
        if (!data) return;
        const unit = unitFn[data.unitKey](data.n);
        const next = fmtLast({ n: data.n, unit });
        if (el.textContent !== next) el.textContent = next;
      });

      // B) “3 total”
      const selTotal = "#MainCopy_ctl29_lbCommunityCount .Count";
      const totalEl = document.querySelector(selTotal);
      if (totalEl) {
        const data = parseTotalCount(totalEl.textContent);
        if (data) {
          const fmtTotal = templates.totalCount[loc] || templates.totalCount.en;
          const next = fmtTotal(data);
          if (totalEl.textContent !== next) totalEl.textContent = next;
        }
      }
    }
  );

  // /profile/connections/following-connections
  register(
    "/profile/connections/following-connections",
    function renderFollowingConnections() {
      // e.g. <div id="FollowedContent_39d10e5a0f...">
      const sel =
        "[id^='FollowedContent_'] .contributions-list-header .text-muted";
      const loc = getLocale();

      document.querySelectorAll(sel).forEach((el) => {
        const data = parseRangeLabel(el.textContent); // reuses your existing parser
        if (!data) return;
        const t = templates.contacts?.[loc] || templates.contacts.en;
        const next = t(data);
        if (el.textContent !== next) el.textContent = next;
      });
    }
  );

  register(
    "/profile/contributions/contributions-list",
    function renderContributionsList() {
      const sel = "#MainCopy_ctl29_SearchResultStatus .ResultStatus.text-muted";
      const el = document.querySelector(sel);
      if (!el) return;

      const raw = el.textContent;
      const data = parseRangeLabel(raw); // reuse your existing (\d+)\D+(\d+)\D+(\d+) parser
      if (!data) return;

      const loc = getLocale();
      const hasWordTotal = /\btotal\b/i.test(raw);
      const t = hasWordTotal
        ? templates.rangeWithTotal[loc] || templates.rangeWithTotal.en
        : templates.contacts[loc] || templates.contacts.en; // your "Showing X to Y of Z"

      const next = t(data);
      if (el.textContent !== next) el.textContent = next;
    }
  );

  // ---------------- Boot + language toggle wiring ----------------
  // DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // Re-render the active page when the user toggles language
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-toggle-lang]");
    if (!link) return;
    e.preventDefault();

    // const lang = (link.getAttribute("data-toggle-lang") || "").toLowerCase();
    // try {
    //   localStorage.setItem("preferredLang", lang === "fr" ? "fr" : "en");
    // } catch {}

    const renderFn = activeRender();
    if (renderFn) renderFn();
  });
})();
