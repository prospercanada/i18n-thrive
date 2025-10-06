(() => {
  // Only run on this page
  if (location.pathname.replace(/\/+$/, "") !== "/profile/connections/contacts")
    return;

  // If this <script> is not `defer`, wait for DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runOnce, { once: true });
  } else {
    runOnce();
  }

  function runOnce() {
    const TARGET = "[id$='FindContacts_ShowingLabel']";
    const el = document.querySelector(TARGET);

    console.log("run once ", el);
    if (!el) return;

    const LOCALE = (document.documentElement.lang || "en-CA").toLowerCase();

    console.log("LOCALE ", LOCALE);
    const templates = {
      "en-ca": ({ start, end, total }) =>
        `Showing ${start} to ${end} of ${total}`,
      "fr-ca": ({ start, end, total }) =>
        `Affichage des éléments ${start} à ${end} sur ${total}`,
    };

    const data = parseRangeLabel(el.textContent);
    if (!data) return; // leave as-is if it doesn't match

    const t = templates[LOCALE] || templates["en-ca"];
    const next = t(data);

    // Only write if different (safe & idempotent)
    if (el.textContent !== next) el.textContent = next;
  }

  function parseRangeLabel(text) {
    // Matches three numbers in order: start, end, total
    // e.g., "Showing 1 to 5 of 5"
    const m = String(text)
      .trim()
      .match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) return null;
    const [, start, end, total] = m.map(Number);
    return { start, end, total };
  }
})();
