/*! Thrive i18n bootstrap - attach data-i18n attributes */

/*
It defines a tiny “bootstrap” for your Thrive i18n system whose job is to tag DOM elements with data-i18n* attributes so your main translator can find and replace text later.

*/
(function () {
  async function loadJSON(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Failed to fetch ${url}`);
    return r.json();
  }

  function attach(entries) {
    for (const e of entries || []) {
      const { selector, type, attr, key } = e || {};
      if (!selector || !key) continue;

      const el = document.querySelector(selector);
      if (!el) continue;

      if (type === "text") {
        el.setAttribute("data-i18n", key);
      } else if (type === "attr" && attr) {
        const existing = el.getAttribute("data-i18n-attr") || "";
        const pair = `${attr}:${key}`;
        el.setAttribute(
          "data-i18n-attr",
          existing ? existing + "," + pair : pair
        );
      }
    }
  }

  // Your attach() currently uses querySelector (first match). Switch to querySelectorAll so every instance in the list gets tagged.
  // function attach(entries, root = document) {
  //   for (const e of entries || []) {
  //     const { selector, type, attr, key } = e || {};
  //     if (!selector || !key) continue;

  //     const nodes = root.querySelectorAll(selector); // ← ALL matches
  //     if (!nodes.length) continue;

  //     nodes.forEach((el) => {
  //       if (type === "text") {
  //         el.setAttribute("data-i18n", key);
  //       } else if (type === "attr" && attr) {
  //         const existing = el.getAttribute("data-i18n-attr") || "";
  //         const pair = `${attr}:${key}`;
  //         el.setAttribute(
  //           "data-i18n-attr",
  //           existing ? existing + "," + pair : pair
  //         );
  //       }
  //     });
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
