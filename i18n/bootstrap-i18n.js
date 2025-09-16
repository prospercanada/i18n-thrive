/*! bootstrap-i18n.js */
(function () {
  const loadJSON = (url) =>
    fetch(url, { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error(`Failed ${url}`);
      return r.json();
    });
  const toAbs = (base, file) =>
    new URL(file, new URL(base, location.origin)).toString();

  function attach(entries) {
    for (const e of entries || []) {
      const { selector, type, attr, key } = e || {};
      if (!selector || !type || !key) continue;
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

  async function run(opts) {
    const { manifestUrl, namespaces = ["profile"], onlyIf } = opts || {};
    if (!manifestUrl) throw new Error("manifestUrl required");
    if (typeof onlyIf === "function" && !onlyIf()) return;

    const manifest = await loadJSON(manifestUrl);
    const mapUrls = namespaces
      .map((ns) => manifest[`${ns}.map`])
      .filter(Boolean)
      .map((file) => toAbs(manifestUrl, file));

    const maps = await Promise.all(mapUrls.map(loadJSON));
    maps.forEach(attach);

    console.log("[i18n bootstrap] attached for:", namespaces.join(", "));
  }

  window.ThriveI18nBootstrap = run;
})();
