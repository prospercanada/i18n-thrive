(function () {
  const STORE_KEY = "preferredLang";
  const ATTRS = [
    "aria-label",
    "title",
    "alt",
    "placeholder",
    "value",
    "data-i18n-text",
  ]; // NEW    "data-i18n-text",
  // const isAllowedAttr = (a) => ATTRS.includes(a) || a.startsWith("data-"); /// NEW
  const state = {
    lang: "en",
    catalogs: {},
    opts: null, // { manifestUrl, namespaces, observeMutations }
    observer: null,
    ready: false, // flips true after init finishes first load
    pending: [], // queued languages before ready
  };

  function firstTextNode(el) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        return n.nodeValue && n.nodeValue.trim() ? 1 : 2;
      },
    });
    return w.nextNode();
  }

  function applyToElement(el, tmap) {
    const key = el.getAttribute("data-i18n");
    if (key && tmap[key] != null) {
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = tmap[key];
      else {
        const tn = firstTextNode(el);
        if (tn) tn.nodeValue = tmap[key];
        else el.textContent = tmap[key];
      }
    }
    const map = el.getAttribute("data-i18n-attr");
    // NEW REMOVED THIS
    // if (map) {
    //   map.split(",").forEach((pair) => {
    //     const [attr, k] = pair.split(":").map((s) => s.trim());
    //     if (ATTRS.includes(attr) && tmap[k] != null)
    //       // if (isAllowedAttr(attr) && tmap[k] != null)   /// NEW

    //       el.setAttribute(attr, tmap[k]);
    //   });
    // }

    // NEW
    if (map) {
      map.split(",").forEach((pair) => {
        const [attr, k] = pair.split(":").map((s) => s.trim());
        if (!ATTRS.includes(attr) || tmap[k] == null) return;

        if (attr === "data-i18n-text") {
          const txt = tmap[k].replace(/&nbsp;/g, "\u00A0"); // decode &nbsp;
          const tn = firstTextNode(el);
          if (tn) tn.nodeValue = txt;
          else el.insertBefore(document.createTextNode(txt), el.firstChild);
        } else {
          el.setAttribute(attr, tmap[k]);
        }
      });
    }
  }

  // <-- new ???????????????????????????
  // function applyLeadingTextAll(tmap) {
  //   document.querySelectorAll("[data-i18n-text]").forEach((el) => {
  //     const k = el.getAttribute("data-i18n-text");
  //     if (k && tmap[k] != null) setLeadingLabel(el, tmap[k]);
  //   });
  // }

  // <-- new ???????????????????????????
  // function applyI18nTextAttr(tmap) {
  //   document.querySelectorAll("[data-i18n-text]").forEach((el) => {
  //     const k = el.getAttribute("data-i18n-text");
  //     if (k && tmap[k] != null) {
  //       const tn = firstTextNode(el);
  //       if (tn) tn.nodeValue = tmap[k];
  //       else el.textContent = tmap[k];
  //     }
  //   });
  // }
  function applyAll(tmap) {
    if (!tmap) return;
    document
      .querySelectorAll("[data-i18n],[data-i18n-attr]")
      .forEach((el) => applyToElement(el, tmap));

    // applyI18nTextAttr(tmap); // <-- new ???????????????????????????
  }

  async function loadJSON(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Failed to fetch ${url}`);
    return r.json();
  }

  async function loadCatalogs(manifestUrl, namespaces, lang) {
    const manifest = await loadJSON(manifestUrl);
    const base = new URL(manifestUrl, location.origin);
    const urls = (namespaces || [])
      .map((ns) => manifest[`${ns}.${lang}`])
      .filter(Boolean)
      .map((rel) => new URL(rel, base).toString());
    const parts = await Promise.all(
      urls.map((u) => fetch(u, { cache: "no-store" }).then((r) => r.json()))
    );
    return Object.assign({}, ...parts);
  }

  // add near your other helpers
  // NEW
  async function installMaps(manifestUrl, namespaces) {
    const manifest = await loadJSON(manifestUrl);
    const base = new URL(manifestUrl, location.origin);

    // Find all .map.json entries for the requested namespaces
    const mapUrls = (namespaces || [])
      .map((ns) => manifest[`${ns}.map`]) // ← manifest must expose this key
      .filter(Boolean)
      .map((rel) => new URL(rel, base).toString());

    // Load and flatten all map rows
    const maps = (await Promise.all(mapUrls.map(loadJSON))).flat();

    // Apply each row by *adding* data-i18n / data-i18n-attr to matching nodes
    maps.forEach((row) => {
      document.querySelectorAll(row.selector).forEach((el) => {
        if (row.type === "text") {
          el.setAttribute("data-i18n", row.key);
        } else if (row.type === "attr") {
          const pair = `${row.attr}:${row.key}`;
          const prev = el.getAttribute("data-i18n-attr");
          el.setAttribute("data-i18n-attr", prev ? `${prev},${pair}` : pair);
        }
      });
    });
  }

  async function loadAndApply(lang) {
    if (!state?.opts?.manifestUrl) {
      throw new Error("ThriveI18n not initialized: missing opts.manifestUrl");
    }
    state.lang = lang === "fr" ? "fr" : "en";
    localStorage.setItem(STORE_KEY, state.lang);

    const { manifestUrl, namespaces, observeMutations } = state.opts;

    // 1) Ensure DOM has data-i18n & data-i18n-attr per map.json
    await installMaps(manifestUrl, namespaces); // NEW

    // 2) Load catalogs and translate
    const tmap = await loadCatalogs(manifestUrl, namespaces, state.lang);

    state.catalogs = tmap;
    applyAll(tmap);

    const DEBUG_I18N = true; // NEW

    if (observeMutations) {
      console.log("loadAndApply ", observeMutations);
      if (state.observer) {
        console.log("state.observer.disconnect() ");
        state.observer.disconnect();
      }

      // NEW begin
      let raf = 0,
        burstId = 0;

      const onMutate = (mutationList) => {
        console.log("CALLED MUTATION");
        if (DEBUG_I18N) {
          console.groupCollapsed(
            `%c[i18n] mutations #${burstId + 1}`,
            "color:#0a7"
          );
          for (const m of mutationList) {
            console.log(m.type, {
              target: m.target,
              attributeName: m.attributeName,
              added: m.addedNodes?.length || 0,
              removed: m.removedNodes?.length || 0,
              value: m.type === "characterData" ? m.target?.data : undefined,
            });
          }
          console.groupEnd();
        }

        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          burstId++;
          if (DEBUG_I18N) console.time(`[i18n] applyAll #${burstId}`);
          applyAll(state.catalogs);
          if (DEBUG_I18N) console.timeEnd(`[i18n] applyAll #${burstId}`);
        });
      };
      // NEW END
      // state.observer = new MutationObserver(() => applyAll(state.catalogs)); // NEW REMOVED
      state.observer = new MutationObserver(onMutate); // NEW
      state.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true, // NEW
        // characterData: true, // <-- catch text-node edits
        attributeFilter: ["data-i18n", "data-i18n-attr", "data-i18n-text"], // NEW
      });
    }
  }

  async function init(opts) {
    state.opts = Object.assign(
      { namespaces: ["profile"], observeMutations: true },
      opts || {}
    );

    // initial language (persisted or default)
    const initial = (localStorage.getItem(STORE_KEY) || "en").toLowerCase();
    await loadAndApply(initial);

    state.ready = true;

    // flush any queued toggles
    if (state.pending.length) {
      const queued = state.pending.splice(0);
      for (const lang of queued) {
        await loadAndApply(lang);
      }
    }

    // react to cross-tab changes
    window.addEventListener("storage", (e) => {
      if (e.key === STORE_KEY && e.newValue && e.newValue !== state.lang) {
        loadAndApply(e.newValue);
      }
    });
  }

  // Safe toggle: queue if not ready yet
  async function setLangNoReload(next) {
    if (!state.ready) {
      state.pending.push(next);
      // cosmetic: reflect intent immediately
      document.documentElement.setAttribute(
        "lang",
        next === "fr" ? "fr" : "en"
      );
      return;
    }
    await loadAndApply(next);
    document.documentElement.setAttribute("lang", next === "fr" ? "fr" : "en");
  }

  function t(key) {
    return state.catalogs[key] ?? key;
  }

  function fmtNumber(n, o) {
    return new Intl.NumberFormat(
      state.lang === "fr" ? "fr-CA" : "en-CA",
      o
    ).format(n);
  }

  function fmtDate(d, o) {
    const dt = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat(
      state.lang === "fr" ? "fr-CA" : "en-CA",
      o
    ).format(dt);
  }

  // Optional: tiny debug snapshot
  function __debug() {
    return {
      lang: state.lang,
      ready: state.ready,
      pending: [...state.pending],
      opts: state.opts && {
        ...state.opts,
        manifestUrl: state.opts.manifestUrl,
      },
      hasObserver: !!state.observer,
      catalogKeys: Object.keys(state.catalogs).length,
    };
  }

  window.ThriveI18n = {
    init,
    setLangNoReload,
    t,
    fmtNumber,
    fmtDate,
    __debug,
    get ready() {
      return state.ready;
    },
  };
})();
