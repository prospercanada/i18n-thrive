// src/index.js
import { initToggle } from "./core/i18n-toggle.js";
import { initI18n } from "./core/i18n.js"; // your consolidated core
// import { initDynamic } from "./features/dynamic-i18n.js";
// import { initDoIt, pickNamespaces } from "./features/doit.js";

import { pickNamespaces } from "./features/doit.js";
import { initDynamic } from "./features/dynamic-i18n.js";

function boot() {
  initToggle();

  // If you prefer orchestration here instead of inside initDoIt:
  const namespaces = pickNamespaces();
  initI18n({
    manifestUrl:
      "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
    namespaces,
    observeMutations: true,
  });

  initDynamic(); // page-scoped text transforms (reruns on langchange)
  //   initDoIt({
  //     manifestUrl:
  //       "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
  //   });
}

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", boot, { once: true })
  : boot();

// (Optional) expose a tiny global for consoles/tests
window.i18nThrive = { pickNamespaces };
