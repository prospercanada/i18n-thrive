/*! Thrive i18n bootstrap: attach data-i18n attributes based on JSON mapping */
(async function () {
  const MANIFEST_URL = "https://YOUR-CDN/i18n/manifest.json";
  const PAGE_NAMESPACE = "profile"; // change per page

  // Load manifest
  async function loadJSON(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Failed to fetch ${url}`);
    return r.json();
  }

  try {
    const manifest = await loadJSON(MANIFEST_URL);

    // Always use EN JSON for mapping (selectors + keys come from EN export)
    const enFile = manifest[`${PAGE_NAMESPACE}.en`];
    if (!enFile) {
      console.warn(`[i18n bootstrap] No EN file for ${PAGE_NAMESPACE}`);
      return;
    }

    const base = new URL(MANIFEST_URL, location.origin);
    const url = new URL(enFile, base);
    const mapping = await loadJSON(url);

    mapping.forEach((entry) => {
      const { selector, type, attr, key } = entry;
      if (!selector) return;
      const el = document.querySelector(selector);
      if (!el) return;

      if (type === "text") {
        // attach data-i18n for text content
        el.setAttribute("data-i18n", key);
      } else if (type === "attr" && attr) {
        // attach data-i18n-attr for attribute translations
        const existing = el.getAttribute("data-i18n-attr") || "";
        const newPair = `${attr}:${key}`;
        const merged = existing
          ? existing.split(",").concat(newPair).join(",")
          : newPair;
        el.setAttribute("data-i18n-attr", merged);
      }
    });

    console.log(`[i18n bootstrap] Attached data-i18n for ${PAGE_NAMESPACE}`);
  } catch (err) {
    console.error("[i18n bootstrap] Error:", err);
  }
})();
