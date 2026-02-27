// dynamic-i18n.js (single file, page-scoped renders, no MutationObserver)
(() => {
  /// GGG START
  function translateDynamicUl(ulId, map, parentId, eventName) {
    // default to your event name
    eventName = eventName || "langchange";

    function getLocaleSafe() {
      try {
        // prefer event-provided value; fallback to getLocale/html lang
        return (
          (typeof getLocale === "function" && getLocale()) ||
          document.documentElement.lang ||
          "en"
        );
      } catch (e) {
        return document.documentElement.lang || "en";
      }
    }

    function norm(s) {
      return (s || "").replace(/\s+/g, " ").trim();
    }

    function applyForLocale(locale) {
      var ul = document.getElementById(ulId);
      if (!ul) {
        // console.log("applyForLocale CANNOT FIND ", ulId, locale);
        return;
      }
      // console.log("applyForLocale FOUND ", ulId, locale);
      var lis = ul.querySelectorAll("li");
      for (var i = 0; i < lis.length; i++) {
        var li = lis[i];
        if (!li.dataset.i18nOrig) li.dataset.i18nOrig = norm(li.textContent);
        var en = li.dataset.i18nOrig;
        var fr = map[en];
        if (locale === "fr" && fr) {
          if (li.textContent !== fr) li.textContent = fr;
          li.dataset.i18nApplied = "1";
        } else {
          if (li.textContent !== en) li.textContent = en;
          li.dataset.i18nApplied = "";
        }
      }
    }

    function once() {
      applyForLocale(getLocaleSafe());
    }

    var anchor =
      (parentId && document.getElementById(parentId)) || document.body;

    // initial pass
    if (document.readyState === "loading") {
      // console.log("loading");
      document.addEventListener("DOMContentLoaded", once, { once: true });
    } else {
      // console.log("once");
      once();
    }

    // listen to your custom language event
    window.addEventListener(eventName, function (ev) {
      // support {detail:{lang}} and {detail:{locale}}
      var next =
        (ev && ev.detail && (ev.detail.lang || ev.detail.locale)) ||
        getLocaleSafe();
      applyForLocale(next);
    });

    // also react when <html lang="..."> changes (in case you set it)
    if (window.MutationObserver) {
      var langMo = new MutationObserver(once);
      langMo.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["lang"],
      });
    }

    // observe DOM under a stable parent so UL replacements get translated
    if (window.MutationObserver) {
      var mo = new MutationObserver(once);
      mo.observe(anchor, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    // survive ASP.NET WebForms partial postbacks
    if (window.Sys && Sys.WebForms && Sys.WebForms.PageRequestManager) {
      try {
        var prm = Sys.WebForms.PageRequestManager.getInstance();
        prm.add_endRequest(once);
      } catch (e) {}
    }
  }
  /// GGG  END

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

  // GGGGG START
  const PROVINCE_MAP = {
    "Alberta (AB)": "Alberta (Alb.)",
    "British Columbia (BC)": "Colombie-Britannique (C.-B.)",
    "Manitoba (MB)": "Manitoba (Man.)",
    "New Brunswick (NB)": "Nouveau-Brunswick (N.-B.)",
    "Newfoundland and Labrador (NL)": "Terre-Neuve-et-Labrador (T.-N.-L.)",
    "Northwest Territories (NT)": "Territoires du Nord-Ouest (T.N.-O.)",
    "Nova Scotia (NS)": "Nouvelle-Écosse (N.-É.)",
    "Nunavut (NU)": "Nunavut (Nt)",
    "Ontario (ON)": "Ontario (Ont.)",
    "Prince Edward Island (PE)": "Île-du-Prince-Édouard (Î.-P.-É.)",
    "Quebec (QC)": "Québec (Qc)",
    "Saskatchewan (SK)": "Saskatchewan (Sask.)",
    "Yukon (YT)": "Yukon (Yn)",
    Other: "Autre",
    "Not Specified": "Non précisé",
  };

  const SECTOR_MAP = {
    Other: "Autre",
    Academia: "Milieu universitaire",
    Consulting: "Consultation",
    "Federal government": "Gouvernement fédéral",
    Foundation: "Fondation",
    "Municipal government": "Administration municipale",
    "Non-profit sector": "Secteur sans but lucratif",
    "Private sector": "Secteur privé",
    "Provincial government": "Gouvernement provincial",
    "Not Specified": "Non précisé",
  };

  const GEO_MAP = {
    "Large urban (100,000 or more)": "Grande zone urbaine (100 000 ou plus)",
    "Medium urban (30,000 to 99,999)": "Moyenne zone urbaine (30 000 à 99 999)",
    "Small urban (less than 30,000)": "Petite zone urbaine (moins de 30 000)",
    Northern: "Nord",
    Rural: "Rurale",
  };

  // Financial Empowerment Services Offered (EN → FR)
  const FE_OFFERED_MAP = {
    "Tax-filing support (e.g. free tax clinics)":
      "Soutien à la déclaration de revenus (p. ex. cliniques fiscales gratuites)",
    "Help accessing benefits": "Aide pour accéder aux prestations",
    "One-on-one financial coaching (e.g. financial goal setting and action planning)":
      "Encadrement financier individuel (p. ex., établissement d'objectifs financiers et planification des actions)",
    "Financial counselling and problem solving (including debt management)":
      "Conseils financiers et résolution de problèmes (y compris la gestion de la dette)",
    "Financial education": "Éducation financière",
    None: "Aucun",
    Other: "Autre",
  };

  // Other Services Offered (EN → FR)
  const OTHER_SERVICES_MAP = {
    "Access to ID": "Accès à l'identifiant",
    "Banking Access Support": "Soutien pour l’accès bancaire",
    "Budget Counselling": "Conseils budgétaires",
    "Consumer Advocacy": "Représentation des consommateurs",
    "Debt Management": "Gestion de la dette",
    "Eviction Prevention Loan Program":
      "Programme de prêts pour la prévention des expulsions",
    "Housing or Homelessness Support":
      "Soutien en matière de logement et d’itinérance",
    "Income Support": "Soutien au revenu",
    "RDSP Info & Support": "Renseignements sur le REEI et soutien",
    "RESP Info & Support": "Renseignements sur le REEE et soutien",
    None: "Aucun",
    Other: "Autre",
  };

  // Language Preference (EN → FR)
  const LANG_PREF_MAP = {
    English: "Anglais",
    French: "Français",
  };

  const ORG_LANG_PREF_MAP = {
    English: "Anglais",
    French: "Français",
    Other: "Autre",
  };

  // Populations Served (EN → FR)
  const POPS_MAP = {
    "Older people, Elders, or Seniors (65+ years old)":
      "Personnes âgées ou aînés (autochtones) (65 ans et plus)",
    "Youth (15-30 years old)": "Jeunes (entre 15 et 30 ans)",
    "Racialized people": "Personnes racialisées",
    "Black communities": "Communautés noires",
    "Newcomers, Refugees, or Non-Status people":
      "Nouveaux arrivants, réfugiés ou Autochtones non inscrits",
    "First Nations, Métis, and Inuit": "Premières Nations, Métis et Inuit",
    "Those living with disabilities": "Personnes en situation de handicap",
    "Those who are unhoused": "Personnes sans abri",
    "Those living on low incomes": "Personnes à faible revenu",
    Women: "Femmes",
    "2SLGBTQI+": "2ELGBTQI+",
    "Northern Communities": "Communautés du Nord",
    "Rural or Remote Communities": "Communautés rurales ou éloignées",
    "Official language minority community":
      "Communauté de langue officielle en situation minoritaire",
    Other: "Autre",
  };

  // GGGGG START

  // ---------------- Page registry ----------------
  const PAGES = new Map(); // path -> render function

  // function register(path, renderFn) {
  //   PAGES.set(path.replace(/\/+$/, ""), renderFn);
  // }

  /// GGGG BEGIn

  function register(when, renderFn) {
    PAGES.set(when, renderFn);
  }
  function isActive(when) {
    const path = location.pathname.replace(/\/+$/, "") || "/";

    if (typeof when === "function") return !!when(location);
    if (when instanceof RegExp) return when.test(path);

    if (typeof when === "string") {
      const wanted = when.replace(/\/+$/, "") || "/";
      return path === wanted;
    }

    return false;
  }

  function activeRender() {
    for (const [when, render] of PAGES) {
      if (isActive(when)) return render;
    }
    return null;
  }
  /// GGGG BEGIn

  // REMOVED THIS for the above GGGG BEGIn
  // function activeRender() {
  //   const path = location.pathname.replace(/\/+$/, "");
  //   return PAGES.get(path);
  // }

  function init() {
    const renderFn = activeRender();
    if (renderFn) renderFn();
  }

  ///GGGGGG START
  register(
    (loc) =>
      loc.pathname.startsWith("/people/") ||
      loc.pathname.startsWith("/profile"),
    function () {
      // console.log("DEBUG CALLED AS GEO_MAP");

      translateDynamicUl(
        "MainCopy_ctl32_ulDemographicItems",
        PROVINCE_MAP,
        "MainCopy_ctl32_ContactDemographicUpdatePanel",
        "langchange", // your event
      );

      translateDynamicUl(
        "MainCopy_ctl34_ulDemographicItems",
        GEO_MAP,
        "MainCopy_ctl34_ContactDemographicUpdatePanel",
        "langchange", // your event
      );

      translateDynamicUl(
        "MainCopy_ctl36_ulDemographicItems",
        SECTOR_MAP,
        "MainCopy_ctl36_ContactDemographicUpdatePanel",
        "langchange", // your event
      );

      translateDynamicUl(
        "MainCopy_ctl41_ulDemographicItems",
        FE_OFFERED_MAP,
        "MainCopy_ctl41_ContactDemographicUpdatePanel",
        "langchange", // your event
      );

      translateDynamicUl(
        "MainCopy_ctl43_ulDemographicItems",
        OTHER_SERVICES_MAP,
        "MainCopy_ctl43_ContactDemographicUpdatePanel",
        "langchange", // your event
      );

      translateDynamicUl(
        "MainCopy_ctl47_ulDemographicItems",
        LANG_PREF_MAP,
        "MainCopy_ctl47_ContactDemographicUpdatePanel",
        "langchange", // your event
      );
      // translateDynamicUl(
      //   "MainCopy_ctl45_ulDemographicItems",
      //   LANG_PREF_MAP,
      //   "MainCopy_ctl45_ContactDemographicUpdatePanel",
      //   "langchange", // your event
      // );

      translateDynamicUl(
        "MainCopy_ctl45_ulDemographicItems",
        ORG_LANG_PREF_MAP,
        "MainCopy_ctl45_ContactDemographicUpdatePanel",
        "langchange", // your event
      );

      translateDynamicUl(
        "MainCopy_ctl38_ulDemographicItems",
        POPS_MAP,
        "MainCopy_ctl38_ContactDemographicUpdatePanel",
        "langchange", // your event
      );

      // wait ~2s, then refresh the picker
      setTimeout(() => {
        $("#MainCopy_ctl32_lbDemographicItems").selectpicker("refresh");
        $("#MainCopy_ctl36_lbDemographicItems").selectpicker("refresh");
      }, 2000);
    },
  );

  // ALTERNATIVE VERION TO TRY ON SATURDAY@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  register(
    (loc) => loc.pathname.startsWith("/login"),
    // (loc) => loc.pathname.startsWith("/login"),
    function renderLogin() {
      const $ = window.jQuery;
      if (!$) return;

      const IDS = [
        "0bca3586-218f-43b3-b059-0199734a100b-select",
        "d4aedf2d-a642-4b70-81dd-0199734cd5a1-select",
        "7ef9a3b6-0f46-4dac-b38b-0199734efe10-select",
        "172d3906-c563-42c3-bff0-0199735b5682-select",
        "303063c6-1cd6-4d75-8e3b-0199735e0e0d-select",
        "eb4436bb-e703-484c-afc7-0199736d34bf-select",
        "820d636e-9fed-4604-869e-0199736e70b7-select",
        "c0dc62b2-8229-4be8-a60a-019c4d473226-select",
      ];

      const COUNT_FMT = {
        en: "{0} items selected",
        fr: "{0} éléments sélectionnés",
      };

      function currentLang(e) {
        const fromEvt = (e?.detail?.lang || "").toLowerCase();
        if (fromEvt) return fromEvt.startsWith("fr") ? "fr" : "en";

        const docLang = (document.documentElement.lang || "").toLowerCase();
        return docLang.startsWith("fr") ? "fr" : "en";
      }

      // this version should resolve the count and the input lable hint
      function refreshSelectpickers(lang) {
        if (!$.fn.selectpicker) return;

        IDS.forEach((id) => {
          const $el = $(`#${id}`);
          if (!$el.length) return;

          const picker = $el.data("selectpicker");
          if (!picker) return;

          // Re-sync internal title from translated select
          picker.options.title = $el.attr("title");

          // Re-sync count text
          picker.options.countSelectedText = COUNT_FMT[lang] || COUNT_FMT.en;

          $el.selectpicker("refresh");
        });
      }

      // function refreshSelectpickers(lang) {
      //   if (!$.fn.selectpicker) return;

      //   const fmt = COUNT_FMT[lang] || COUNT_FMT.en;

      //   IDS.forEach((id) => {
      //     const $el = $(`#${id}`);
      //     if (!$el.length) return;

      //     // Update internal plugin option
      //     $el.data("countSelectedText", fmt);

      //     // Force rebuild
      //     $el.selectpicker("refresh");
      //   });
      // }

      // function refreshSelectpickers(lang) {
      //   if (!$.fn.selectpicker) return;

      //   const fmt = COUNT_FMT[lang] || COUNT_FMT.en;

      //   // IDS.forEach((id) => {
      //   //   const $el = $(`#${id}`);
      //   //   if (!$el.length) return;

      //   //   $el.attr("data-count-selected-text", fmt);
      //   //   $el.selectpicker("refresh");
      //   // });

      //   // N selected
      //   IDS.forEach((id) => {
      //     const $el = $(`#${id}`);
      //     if (!$el.length) return;

      //     // update plugin option (NOT attribute)
      //     $el.data("countSelectedText", fmt);

      //     $el.selectpicker("refresh");
      //   });
      // }

      function init() {
        // Defer one paint cycle to ensure:
        // 1. HL injected DOM
        // 2. Your i18n text replacements applied
        requestAnimationFrame(() => {
          refreshSelectpickers(currentLang());
        });

        setTimeout(() => {
          refreshSelectpickers(currentLang());
        }, 500);
      }

      // Run immediately on page load
      init();

      // CHANGE 11111 -  27 FEB 2026 does this fix theselect items on the login? begin

      // let refreshScheduled = false;
      // let isRefreshing = false;

      // function scheduleRefresh(lang) {
      //   if (refreshScheduled || isRefreshing) return;

      //   refreshScheduled = true;

      //   requestAnimationFrame(() => {
      //     refreshScheduled = false;
      //     isRefreshing = true;

      //     refreshSelectpickers(lang);

      //     isRefreshing = false;
      //   });
      // }

      // function observeDomChanges() {
      //   const observer = new MutationObserver((mutations) => {
      //     if (isRefreshing) return;

      //     let shouldRefresh = false;

      //     for (const m of mutations) {
      //       if (m.type === "childList" && m.addedNodes.length > 0) {
      //         shouldRefresh = true;
      //         break;
      //       }
      //     }

      //     if (shouldRefresh) {
      //       scheduleRefresh(currentLang());
      //     }
      //   });

      //   observer.observe(document.body, {
      //     childList: true,
      //     subtree: true,
      //   });
      // }
      // CHANGE 11111 -  27 FEB 2026 does this fix theselect items on the login? end

      // Re-run on language change
      window.addEventListener("langchange", function (e) {
        requestAnimationFrame(() => {
          refreshSelectpickers(currentLang(e));
        });
      });
    },
  );

  // FOR NOW USE THE ABOVE ALTERNATIVE VERION TO TRY ON SATURDAY@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  // DEGUG REGISTRATION FORM COMMENTED OUT TO CHECK BUG ON LOGIN PAGE 13 FEB 2013
  // register(
  //   (loc) => loc.pathname.startsWith("/login"),
  //   function renderLogin() {
  //     const $ = window.jQuery;
  //     if (!$ || !$.fn.selectpicker) return;

  //     // Organization Location 0bca3586-218f-43b3-b059-0199734a100b-select
  //     // Sector  d4aedf2d-a642-4b70-81dd-0199734cd5a1-select
  //     // Financial Empowerment Services Offered 7ef9a3b6-0f46-4dac-b38b-0199734efe10-select
  //     // Other Services Offered 172d3906-c563-42c3-bff0-0199735b5682-select
  //     // Populations Served 303063c6-1cd6-4d75-8e3b-0199735e0e0d-select
  //     // Geographic Area(s) Served eb4436bb-e703-484c-afc7-0199736d34bf-select
  //     // Language you prefer us to use when communicating with you 820d636e-9fed-4604-869e-0199736e70b7-select
  //     // Select all language(s) that your organization offers financial empowerment services in  c0dc62b2-8229-4be8-a60a-019c4d473226-select
  //     const IDS = [
  //       "0bca3586-218f-43b3-b059-0199734a100b-select",
  //       "d4aedf2d-a642-4b70-81dd-0199734cd5a1-select",
  //       "7ef9a3b6-0f46-4dac-b38b-0199734efe10-select",
  //       "172d3906-c563-42c3-bff0-0199735b5682-select",
  //       "303063c6-1cd6-4d75-8e3b-0199735e0e0d-select",
  //       "eb4436bb-e703-484c-afc7-0199736d34bf-select",
  //       "820d636e-9fed-4604-869e-0199736e70b7-select",
  //       "c0dc62b2-8229-4be8-a60a-019c4d473226-select", //NEW
  //     ];

  //     const COUNT_FMT = {
  //       en: "{0} items selected",
  //       fr: "{0} éléments sélectionnés",
  //     };

  //     // FIXED precedence + tolerant of event.lang values like "fr-CA"
  //     function currLang(e) {
  //       const fromEvt = (e?.detail?.lang || "").toLowerCase();
  //       if (fromEvt) return fromEvt.startsWith("fr") ? "fr" : "en";
  //       const doc = (document.documentElement.lang || "").toLowerCase();
  //       return doc.startsWith("fr") ? "fr" : "en";
  //     }

  //     function noneFromTitle($sel) {
  //       let t = $sel.attr("title") || "Nothing selected";
  //       if (/^\(.*\)$/.test(t)) t = t.slice(1, -1);
  //       return t;
  //     }

  //     function computeLabel($sel, lang) {
  //       const none = noneFromTitle($sel);
  //       const fmt =
  //         $sel.attr("data-count-selected-text") ||
  //         COUNT_FMT[lang] ||
  //         COUNT_FMT.en;
  //       const $selOpts = $sel.find("option:selected");
  //       const n = $selOpts.length;
  //       if (n === 0) return none;
  //       if (n > 1) return fmt.replace("{0}", String(n));
  //       return $selOpts
  //         .map((_, o) => o.textContent.trim())
  //         .get()
  //         .join(", ");
  //     }

  //     function updateFilterOptionText(id, lang) {
  //       const $sel = $(`[id="${id}"]`);
  //       const $btn = $(`.bootstrap-select [data-id="${id}"]`);
  //       if (!$sel.length || !$btn.length) return;
  //       $btn.find(".filter-option").text(computeLabel($sel, lang));
  //     }

  //     // NEW ATTEMPT ONE BEGIN
  //     function initAll() {
  //       const lang = currLang();
  //       const fmt = COUNT_FMT[lang] || COUNT_FMT.en; // fallback

  //       IDS.forEach((id) => {
  //         const $el = $(`[id="${id}"]`);
  //         if (!$el.length) return;

  //         // avoid double-binding
  //         if ($el.data("i18n-bound")) return;

  //         $el.attr("data-count-selected-text", fmt);
  //         $el.selectpicker("refresh");
  //         updateFilterOptionText(id, lang);

  //         $el.off("changed.bs.select.i18n").on("changed.bs.select.i18n", () => {
  //           updateFilterOptionText(id, currLang());
  //         });

  //         $el.data("i18n-bound", true);
  //       });
  //     }

  //     // run after DOM, then delay 500ms
  //     if (document.readyState === "loading") {
  //       document.addEventListener(
  //         "DOMContentLoaded",
  //         () => setTimeout(initAll, 500),
  //         { once: true },
  //       );
  //     } else {
  //       setTimeout(initAll, 500);
  //     }

  //     // When your app language changes, reapply strings and refresh
  //     window.addEventListener("langchange", (e) => {
  //       const lang = currLang(e);
  //       setTimeout(() => {
  //         IDS.forEach((id) => {
  //           const $el = $(`[id="${id}"]`);
  //           if (!$el.length) return;
  //           $el.attr("data-count-selected-text", COUNT_FMT[lang]);
  //           $el.selectpicker("refresh");
  //           updateFilterOptionText(id, lang);
  //         });
  //       }, 0);
  //     });
  //   },
  // );
  ///GGGGGG END

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
    },
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

      // C) “No Results Found” (only when there are no community rows)
      // C) “No Results Found” lives in a sibling node
      (function translateNoResultsSibling() {
        const container = document.getElementById(
          "MainCopy_ctl29_AllCommunitiesContainer",
        );
        if (!container) return;

        const parent = container.parentElement || container;
        // look at *all* siblings (elements + text nodes)
        const siblings = Array.from(parent.childNodes).filter(
          (n) => n !== container,
        );

        // If any sibling is a result row, bail
        const hasResults = siblings.some(
          (n) =>
            n.nodeType === 1 &&
            n.classList?.contains("row") &&
            n.classList?.contains("rowContainer") &&
            n.classList?.contains("community-list"),
        );
        if (hasResults) return;

        // Find the placeholder sibling (can be a text node or a simple element with just the text)
        const placeholder = siblings.find((n) => {
          if (n.nodeType === 3) {
            // text node
            return /^\s*no\s+results\s+found\s*$/i.test(n.textContent);
          }
          if (n.nodeType === 1) {
            // element
            const txt = (n.textContent || "").trim();
            return /^no\s+results\s+found$/i.test(txt);
          }
          return false;
        });
        if (!placeholder) return;

        const msg = loc === "fr" ? "Aucun résultat" : "No Results Found";
        if (placeholder.nodeType === 3) {
          // preserve surrounding whitespace a bit
          placeholder.textContent = " " + msg + " ";
        } else {
          placeholder.textContent = msg;
        }
      })();
    },
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
    },
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
    },
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
