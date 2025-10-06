// src/features/dynamic-i18n.js
// Page-scoped renders, no MutationObserver (orchestrator/i18n will call runActive)

const PAGES = new Map(); // key: path string OR predicate fn -> render fn
let _debounceTimer = null;

function getLocale() {
  // single source of truth (set by i18n-toggle / i18n core)
  const attr = document.documentElement.getAttribute("data-lang");
  return attr === "fr" ? "fr" : "en";
}

// ---------- parsers ----------
function parseCommunityName(text) {
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

// ---------- localized strings ----------
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

// ---------- registry ----------
/**
 * Register a page renderer.
 * @param {string|((loc: Location)=>boolean)} when - path string (exact) or predicate
 * @param {()=>void} render - render function to run when active
 */
export function register(when, render) {
  PAGES.set(when, render);
}

function isActive(when) {
  const path = location.pathname.replace(/\/+$/, "");
  return typeof when === "function"
    ? !!when(location)
    : path === String(when).replace(/\/+$/, "");
}

export function activeRender() {
  for (const [when, render] of PAGES) {
    if (isActive(when)) return render;
  }
  return null;
}

/** Run the active page's render now (debounced to next tick). */
export function runActive() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    const render = activeRender();
    if (render) render();
  }, 0);
}

/** Initialize: run once on DOM ready and wire to langchanges. */
export function initDynamic() {
  const boot = () => runActive();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  // Re-render current page when language changes
  window.addEventListener("langchange", () => runActive());
}

// ---------------- registered pages ----------------

// /advisory-committee
register("/advisory-committee", function renderAdvisoryCommitteeTitle() {
  const el = document.querySelector("#PageTitleH1");
  if (!el) return;
  const MAP = {
    en: "Meet the Resilient Futures Advisory Committee",
    fr: "Rencontrez le comité consultatif de l’initiative Un avenir résilient",
  };
  const next = MAP[getLocale()] || MAP.en;
  if (el.textContent.trim() !== next) el.textContent = next;
});

// /sandboxmicrosite/communities/community-home/invite-community
register(
  "/sandboxmicrosite/communities/community-home/invite-community",
  function renderInviteCommunity() {
    const host = document.querySelector(
      "#MainCopy_ctl04_InviteToCommunityLabel"
    );
    if (!host) return;
    const target = host.querySelector("strong") || host;
    const name =
      parseCommunityName(target.textContent) || target.textContent.trim();
    const loc = getLocale();
    const next =
      loc === "fr"
        ? `Invitez des personnes à rejoindre la communauté ${name}`
        : `Invite people to join ${name}`;
    if (target.textContent !== next) target.textContent = next;
  }
);

// /profile/connections/contacts
register("/profile/connections/contacts", function renderContacts() {
  const el = document.querySelector("[id$='FindContacts_ShowingLabel']");
  if (!el) return;
  const data = parseRangeLabel(el.textContent);
  if (!data) return;
  const t = templates.contacts[getLocale()] || templates.contacts.en;
  const next = t(data);
  if (el.textContent !== next) el.textContent = next;
});

// /profile/connections/communitiesnode
register(
  "/profile/connections/communitiesnode",
  function renderCommunitiesNode() {
    const loc = getLocale();
    const unitFn = UNITS[loc] || UNITS.en;
    const fmtLast = templates.lastJoined[loc] || templates.lastJoined.en;

    // A) “last person joined … ago”
    document
      .querySelectorAll(
        "[id^='MainCopy_ctl29_lstCommunityList_lblLastUpdated_']"
      )
      .forEach((el) => {
        const data = parseLastJoined(el.textContent);
        if (!data) return;
        const unit = unitFn[data.unitKey](data.n);
        const next = fmtLast({ n: data.n, unit });
        if (el.textContent !== next) el.textContent = next;
      });

    // B) “3 total”
    const totalEl = document.querySelector(
      "#MainCopy_ctl29_lbCommunityCount .Count"
    );
    if (totalEl) {
      const data = parseTotalCount(totalEl.textContent);
      if (data) {
        const fmtTotal = templates.totalCount[loc] || templates.totalCount.en;
        const next = fmtTotal(data);
        if (totalEl.textContent !== next) totalEl.textContent = next;
      }
    }

    // C) “No Results Found” (only when no result rows)
    (function translateNoResultsSibling() {
      const container = document.getElementById(
        "MainCopy_ctl29_AllCommunitiesContainer"
      );
      if (!container) return;
      const parent = container.parentElement || container;

      const siblings = Array.from(parent.childNodes).filter(
        (n) => n !== container
      );

      const hasResults = siblings.some(
        (n) =>
          n.nodeType === 1 &&
          n.classList?.contains("row") &&
          n.classList?.contains("rowContainer") &&
          n.classList?.contains("community-list")
      );
      if (hasResults) return;

      const placeholder = siblings.find((n) => {
        if (n.nodeType === 3)
          return /^\s*no\s+results\s+found\s*$/i.test(n.textContent);
        if (n.nodeType === 1)
          return /^no\s+results\s+found$/i.test((n.textContent || "").trim());
        return false;
      });
      if (!placeholder) return;

      const msg = loc === "fr" ? "Aucun résultat" : "No Results Found";
      if (placeholder.nodeType === 3) {
        placeholder.textContent = " " + msg + " ";
      } else {
        placeholder.textContent = msg;
      }
    })();
  }
);

// /profile/connections/following-connections
register(
  "/profile/connections/following-connections",
  function renderFollowingConnections() {
    const sel =
      "[id^='FollowedContent_'] .contributions-list-header .text-muted";
    const loc = getLocale();
    document.querySelectorAll(sel).forEach((el) => {
      const data = parseRangeLabel(el.textContent);
      if (!data) return;
      const t = templates.contacts[loc] || templates.contacts.en;
      const next = t(data);
      if (el.textContent !== next) el.textContent = next;
    });
  }
);

// /profile/contributions/contributions-list
register(
  "/profile/contributions/contributions-list",
  function renderContributionsList() {
    const el = document.querySelector(
      "#MainCopy_ctl29_SearchResultStatus .ResultStatus.text-muted"
    );
    if (!el) return;
    const raw = el.textContent;
    const data = parseRangeLabel(raw);
    if (!data) return;

    const loc = getLocale();
    const hasWordTotal = /\btotal\b/i.test(raw);
    const t = hasWordTotal
      ? templates.rangeWithTotal[loc] || templates.rangeWithTotal.en
      : templates.contacts[loc] || templates.contacts.en;

    const next = t(data);
    if (el.textContent !== next) el.textContent = next;
  }
);
