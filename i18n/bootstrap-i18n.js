/*! Thrive i18n bootstrap - attach data-i18n attributes */

(function () {
  async function loadJSON(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Failed to fetch ${url}`);
    return r.json();
  }

  // You only tag the first matching element
  // You’re accumulating duplicates in data-i18n-attr
  //There’s no way to set data-i18n-html from the map
  function attach(entries) {
    for (const e of entries || []) {
      const { selector, type, attr, key } = e || {};
      if (!selector || !key) continue;

      const nodes = document.querySelectorAll(selector);
      if (!nodes.length) continue;

      nodes.forEach((el) => {
        if (type === "text") {
          el.setAttribute("data-i18n", key);
        } else if (type === "html") {
          // flag so applyToElement uses innerHTML
          el.setAttribute("data-i18n", key);
          el.toggleAttribute("data-i18n-html", true);
        } else if (type === "attr" && attr) {
          // build/merge a de-duped set of attr:key pairs
          const existing = el.getAttribute("data-i18n-attr");
          const parts = existing
            ? existing
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
          parts.push(`${attr}:${key}`);
          const deduped = [...new Set(parts)];
          el.setAttribute("data-i18n-attr", deduped.join(","));
        }
      });
    }
  }

  // function attach(entries) {
  //   for (const e of entries || []) {
  //     const { selector, type, attr, key } = e || {};
  //     if (!selector || !key) continue;

  //     const el = document.querySelector(selector);
  //     if (!el) continue;

  //     if (type === "text") {
  //       el.setAttribute("data-i18n", key);
  //     } else if (type === "attr" && attr) {
  //       const existing = el.getAttribute("data-i18n-attr") || "";
  //       const pair = `${attr}:${key}`;
  //       el.setAttribute(
  //         "data-i18n-attr",
  //         existing ? existing + "," + pair : pair
  //       );
  //     }
  //   }
  // }

  async function run(opts) {
    const { manifestUrl, namespaces = [], onlyIf } = opts || {};
    if (!manifestUrl) throw new Error("manifestUrl required");

    // ✅ optional guard
    if (typeof onlyIf === "function" && !onlyIf()) {
      console.debug("[i18n bootstrap] skipped by onlyIf");
      return;
    }

    const manifest = await loadJSON(manifestUrl);

    for (const ns of namespaces) {
      const mapFile = manifest[`${ns}.map`];
      if (!mapFile) continue;

      const base = new URL(manifestUrl, location.origin);
      const mapUrl = new URL(mapFile, base).toString();
      const map = await loadJSON(mapUrl);

      attach(map);
    }

    console.log("[i18n bootstrap] attached:", namespaces.join(", "));
  }

  // expose globally so you can call it
  window.ThriveI18nBootstrap = run;
})();
