(function () {
  const STORE_KEY = "preferredLang";
  const ATTRS = [
    "aria-label",
    "title",
    "alt",
    "placeholder",
    "value",
    "data-i18n-text",
    // popover attrs (BS3/4)
    "data-content",
    "data-original-title",
  ];

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

  function sameHTML(a, b) {
    // cheap check first
    if (a === b) return true;
    // normalize common no-ops: &nbsp; vs \u00A0 and trim insignificant whitespace
    return (
      a.replace(/\u00A0/g, "&nbsp;").trim() ===
      b.replace(/\u00A0/g, "&nbsp;").trim()
    );
  }

  function setFirstText(el, txt) {
    const tn = firstTextNode(el);
    if (tn) {
      if (tn.nodeValue !== txt) tn.nodeValue = txt;
    } else if (el.textContent !== txt) {
      el.textContent = txt;
    }
  }

  // VERISON TO HELP PREVENT LOOPS
  function applyToElement(el, tmap) {
    // ---- element text/html ----
    const key = el.getAttribute("data-i18n");
    if (key && tmap[key] != null) {
      const val = String(tmap[key]);
      const wantsHtml = el.hasAttribute("data-i18n-html");

      // optional: short-circuit if we already applied this exact value
      const sig = key + "§" + val.length;
      if (el.dataset.i18nApplied === sig) {
        // already done; skip text/html part
      } else if (wantsHtml) {
        if (!sameHTML(el.innerHTML, val)) el.innerHTML = val;
        el.dataset.i18nApplied = sig;
      } else {
        // normalize &nbsp; in text path too
        const txt = val.replace(/&nbsp;/g, "\u00A0");
        // only write if changed
        const tn = firstTextNode(el);
        const current = tn ? tn.nodeValue : el.textContent;
        if (current !== txt) setFirstText(el, txt);
        el.dataset.i18nApplied = sig;
      }
    }

    // ---- attributes ----
    const raw = el.getAttribute("data-i18n-attr");
    if (!raw) return;

    const pairs = [
      ...new Set(
        raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    ];

    for (const entry of pairs) {
      const i = entry.indexOf(":");
      if (i < 0) continue;

      const attr = entry.slice(0, i).trim();
      const k = entry.slice(i + 1).trim();

      if (!ATTRS.includes(attr)) continue;
      if (tmap[k] == null) continue;

      let next = String(tmap[k]);

      if (attr === "data-i18n-text") {
        const txt = next.replace(/&nbsp;/g, "\u00A0");
        const tn = firstTextNode(el);
        const current = tn ? tn.nodeValue : "";
        if (current !== txt) {
          if (tn) tn.nodeValue = txt;
          else el.insertBefore(document.createTextNode(txt), el.firstChild);
        }
        continue;
      }

      if (
        attr === "title" ||
        attr === "aria-label" ||
        attr === "placeholder" ||
        attr === "value"
      ) {
        next = next.replace(/&nbsp;/g, "\u00A0");
      }

      if (el.getAttribute(attr) !== next) {
        el.setAttribute(attr, next);
      }
    }
  }

  // VERSION TO PREVENT MULTIPLE ATTRIBUTES
  //data-i18n-attr="title:contacts_sort_title,title:contacts_sort_title,title:contacts_sort_title">

  // function applyToElement(el, tmap) {
  //   // ---- element text/html ----
  //   const key = el.getAttribute("data-i18n");
  //   if (key && tmap[key] != null) {
  //     const val = String(tmap[key]);
  //     if (el.hasAttribute("data-i18n-html")) {
  //       // If you allow HTML, consider sanitizing (e.g., DOMPurify.sanitize(val))
  //       el.innerHTML = val;
  //     } else {
  //       // Prefer textContent (preserves child elements if you only change first text node)
  //       const tn = firstTextNode(el);
  //       if (tn) tn.nodeValue = val;
  //       else el.textContent = val;
  //     }
  //   }

  //   // ---- attributes ----
  //   const raw = el.getAttribute("data-i18n-attr");
  //   if (!raw) return;

  //   // split, trim, drop empties, and de-dupe while preserving order
  //   const pairs = [
  //     ...new Set(
  //       raw
  //         .split(",")
  //         .map((s) => s.trim())
  //         .filter(Boolean)
  //     ),
  //   ];

  //   for (const entry of pairs) {
  //     // robust "attr:key" parsing (handles extra colons in key)
  //     const i = entry.indexOf(":");
  //     if (i < 0) continue;

  //     const attr = entry.slice(0, i).trim();
  //     const k = entry.slice(i + 1).trim();

  //     if (!ATTRS.includes(attr)) continue;
  //     if (tmap[k] == null) continue;

  //     // get the translated value once
  //     let next = String(tmap[k]);

  //     if (attr === "data-i18n-text") {
  //       // Write text node at the start, normalize &nbsp;
  //       next = next.replace(/&nbsp;/g, "\u00A0");
  //       const tn = firstTextNode(el);
  //       if (tn) tn.nodeValue = next;
  //       else el.insertBefore(document.createTextNode(next), el.firstChild);
  //       continue;
  //     }

  //     // Normalize &nbsp; for common texty attributes
  //     if (
  //       attr === "title" ||
  //       attr === "aria-label" ||
  //       attr === "placeholder" ||
  //       attr === "value"
  //     ) {
  //       next = next.replace(/&nbsp;/g, "\u00A0");
  //     }

  //     // Boolean attribute handling (optional)
  //     // e.g., if you ever translate to "", you can remove instead of setting empty
  //     // if (attr === "disabled" || attr === "required") {
  //     //   if (next === "" || next === "false") el.removeAttribute(attr);
  //     //   else el.setAttribute(attr, attr);
  //     //   continue;
  //     // }

  //     // Skip write if identical (avoids MutationObservers looping)
  //     if (el.getAttribute(attr) !== next) {
  //       el.setAttribute(attr, next);
  //     }
  //   }
  // }

  // LAST GOOD
  // function applyToElement(el, tmap) {
  //   const key = el.getAttribute("data-i18n");
  //   if (key && tmap[key] != null) {
  //     if (el.hasAttribute("data-i18n-html")) el.innerHTML = tmap[key];
  //     else {
  //       const tn = firstTextNode(el);
  //       if (tn) tn.nodeValue = tmap[key];
  //       else el.textContent = tmap[key];
  //     }
  //   }
  //   const map = el.getAttribute("data-i18n-attr");

  //   if (map) {
  //     map.split(",").forEach((pair) => {
  //       const [attr, k] = pair.split(":").map((s) => s.trim());
  //       if (!ATTRS.includes(attr) || tmap[k] == null) return;

  //       if (attr === "data-i18n-text") {
  //         const txt = tmap[k].replace(/&nbsp;/g, "\u00A0"); // decode &nbsp;
  //         const tn = firstTextNode(el);
  //         if (tn) tn.nodeValue = txt;
  //         else el.insertBefore(document.createTextNode(txt), el.firstChild);
  //       } else {
  //         el.setAttribute(attr, tmap[k]);
  //       }
  //     });
  //   }
  // }

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

  function attachMaps(entries, root = document) {
    for (const e of entries || []) {
      const { selector, type, attr, key } = e || {};
      if (!selector || !key) continue;

      const nodes = root.querySelectorAll(selector); // ALL matches in the new subtree
      if (!nodes.length) continue;

      nodes.forEach((el) => {
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
      });
    }
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
    // console.log("state.catalogs ", state.catalogs);
    applyAll(tmap);

    // const DEBUG_I18N = true; // NEW

    if (observeMutations) {
      // console.log("loadAndApply ", observeMutations);
      if (state.observer) {
        // console.log("state.observer.disconnect() ");
        state.observer.disconnect();
      }

      // CHANGE 3 BEGIN
      let _manifestPromise;
      const _mapsByNs = new Map();
      function getManifest(manifestUrl) {
        _manifestPromise ||= loadJSON(manifestUrl);
        return _manifestPromise;
      }
      async function getMap(manifestUrl, ns) {
        if (_mapsByNs.has(ns)) return _mapsByNs.get(ns);
        const manifest = await getManifest(manifestUrl);
        const mapFile = manifest[`${ns}.map`];
        if (!mapFile) return null;
        const base = new URL(manifestUrl, location.origin);
        const url = new URL(mapFile, base).toString();
        const map = await loadJSON(url);
        _mapsByNs.set(ns, map);
        return map;
      }

      let isApplying = false;
      let flushScheduled = false;
      const pendingRoots = new Set(); // elements needing tag+apply

      function schedule(el) {
        if (!el || el.nodeType !== 1) return;
        pendingRoots.add(el);
        if (!flushScheduled) {
          flushScheduled = true;
          queueMicrotask(flush);
        }
      }

      async function flush() {
        flushScheduled = false;
        if (!pendingRoots.size) return;

        isApplying = true;
        try {
          // Tag and apply only for affected subtrees
          const roots = Array.from(pendingRoots);
          pendingRoots.clear();

          // Tag (attach maps) inside each root
          for (const root of roots) {
            for (const ns of state.opts.namespaces) {
              const map = await getMap(state.opts.manifestUrl, ns);
              if (map) attachMaps(map, root); // your function that sets data-i18n*, de-duped
            }
          }

          // Apply translations only within those roots
          for (const root of roots) {
            applyAll(state.catalogs, root); // update your applyAll to accept an optional root
          }
        } finally {
          isApplying = false;
        }
      }
      // CHANGE 3 END
      // Keep a cached manifest + namespace→map lookup

      // ANOTHER TRY START
      // CHANGE 2 REMOVED
      // let _manifest,
      //   _mapsByNs = {};

      // CHANGE 2 REMOVED
      // async function getMap(manifestUrl, ns) {
      //   if (!_manifest) _manifest = await loadJSON(manifestUrl);
      //   const mapFile = _manifest[`${ns}.map`];
      //   if (!mapFile) return null;
      //   if (!_mapsByNs[ns]) {
      //     const base = new URL(manifestUrl, location.origin);
      //     _mapsByNs[ns] = await loadJSON(new URL(mapFile, base).toString());
      //   }
      //   return _mapsByNs[ns];
      // }

      // In your observer callback:

      // CHANGE 2 ADD
      // Create observer once per loadAndApply call
      state.observer = new MutationObserver((records) => {
        if (isApplying) return; // ignore our own writes

        for (const m of records) {
          if (m.type === "childList") {
            m.addedNodes.forEach((n) => schedule(n));
          } else if (m.type === "attributes") {
            // an element just got i18n flags set → (re)tag/reapply it
            schedule(m.target);
          }
        }
      });

      // CHANGE 2 REMOVED
      // state.observer = new MutationObserver(async (list) => {
      //   const added = list
      //     .flatMap((m) =>
      //       m.type === "childList" ? Array.from(m.addedNodes) : []
      //     )
      //     .filter((n) => n.nodeType === 1); // Elements only

      //   if (added.length) {
      //     for (const root of added) {
      //       for (const ns of state.opts.namespaces) {
      //         const map = await getMap(state.opts.manifestUrl, ns);
      //         // if (map) attach(map, root); // ← tag inside this new subtree
      //         if (map) attachMaps(map, root); // ← tag inside this new subtree
      //       }
      //     }
      //   }

      //   applyAll(state.catalogs); // ← now translation sticks again
      // });

      // CHANGE 1 REMOVED
      // state.observer.observe(document.body, {
      //   childList: true,
      //   subtree: true,
      //   attributes: true, // NEW
      //   // characterData: true, // <-- catch text-node edits
      //   attributeFilter: ["data-i18n", "data-i18n-attr", "data-i18n-text"], // NEW
      // });

      // CHANGE 1 ADD
      // IMPORTANT: filter to just your flags, not translated attrs like title/aria-label
      state.observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["data-i18n", "data-i18n-attr", "data-i18n-html"], // ← fix here
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
