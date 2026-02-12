var i18nThrive = (() => {
  var B = !1,
    W = "preferredLang",
    rt = [
      { code: "en", label: "English", htmlLang: "en-CA" },
      { code: "fr", label: "Fran\xE7ais", htmlLang: "fr-CA" },
    ],
    E = (t) => (String(t || "en").toLowerCase() === "fr" ? "fr" : "en");
  function j() {
    try {
      return E(localStorage.getItem(W));
    } catch (t) {
      return "en";
    }
  }
  function q(t) {
    let e = E(t);
    (document.documentElement.setAttribute("data-lang", e),
      document.documentElement.setAttribute(
        "lang",
        e === "fr" ? "fr-CA" : "en-CA",
      ));
  }
  async function st(t, { notifyAlways: e = !1 } = {}) {
    var i, r;
    let o = E(t),
      n = document.documentElement.getAttribute("data-lang") || "en";
    try {
      localStorage.setItem(W, o);
    } catch (s) {}
    if ((n !== o && q(o), (i = window.ThriveI18n) != null && i.setLangNoReload))
      try {
        await window.ThriveI18n.setLangNoReload(o);
      } catch (s) {
        console.error("[i18n] setLangNoReload failed:", s);
      }
    if ((r = window.i18next) != null && r.changeLanguage)
      try {
        await window.i18next.changeLanguage(o);
      } catch (s) {
        console.warn("[i18n] i18next.changeLanguage failed:", s);
      }
    (e || n !== o) &&
      window.dispatchEvent(
        new CustomEvent("langchange", { detail: { lang: o } }),
      );
  }
  function H() {
    return document.querySelector(".nav.navbar-nav");
  }
  function M(t) {
    let e = H();
    if (!e) return;
    e.querySelectorAll("li[data-lang-toggle]").forEach((r) => r.remove());
    let o = rt.find((r) => r.code !== t);
    if (!o) return;
    let n = document.createElement("li");
    n.setAttribute("data-lang-toggle", "true");
    let i = document.createElement("a");
    ((i.href = "#"),
      i.setAttribute("role", "button"),
      i.setAttribute("aria-label", `Switch to ${o.label}`),
      (i.dataset.toggleLang = o.code),
      (i.textContent = o.label),
      n.appendChild(i),
      e.appendChild(n),
      e.dataset.langToggleBound ||
        (e.addEventListener("click", (r) => {
          let s = r.target.closest("[data-toggle-lang]");
          if (!s) return;
          r.preventDefault();
          let d = s.dataset.toggleLang;
          (st(d, { notifyAlways: !0 }), M(d));
        }),
        (e.dataset.langToggleBound = "1")));
  }
  var U = null;
  function ct() {
    if (U) return;
    let t = new MutationObserver(() => {
      let e = H();
      e && !e.querySelector("li[data-lang-toggle]") && M(j());
    });
    (t.observe(document.documentElement, { childList: !0, subtree: !0 }),
      (U = () => t.disconnect()));
  }
  function G() {
    var o;
    if (B) return;
    B = !0;
    let t = j();
    (q(t),
      (o = window.i18next) != null &&
        o.changeLanguage &&
        window.i18next
          .changeLanguage(t)
          .catch((n) =>
            console.warn("[i18n] initial i18next.changeLanguage failed:", n),
          ),
      window.dispatchEvent(
        new CustomEvent("langchange", { detail: { lang: t } }),
      ));
    let e = () => {
      (M(t), ct());
    };
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", e, { once: !0 })
      : e();
  }
  var l = {
      lang: "en",
      catalogs: {},
      opts: null,
      observer: null,
      ready: !1,
      pending: [],
      isApplying: !1,
    },
    N = "preferredLang",
    ut = new Set([
      "aria-label",
      "title",
      "alt",
      "placeholder",
      "value",
      "data-i18n-text",
      "data-content",
      "data-original-title",
    ]),
    I = (t) => (String(t || "en").toLowerCase() === "fr" ? "fr" : "en");
  function J(t) {
    let e = I(t);
    (document.documentElement.setAttribute("data-lang", e),
      document.documentElement.setAttribute(
        "lang",
        e === "fr" ? "fr-CA" : "en-CA",
      ),
      window.dispatchEvent(
        new CustomEvent("langchange", { detail: { lang: e } }),
      ));
  }
  function x(t) {
    return document
      .createTreeWalker(t, NodeFilter.SHOW_TEXT, {
        acceptNode(o) {
          return o.nodeValue && o.nodeValue.trim() ? 1 : 2;
        },
      })
      .nextNode();
  }
  function lt(t, e) {
    return t === e
      ? !0
      : t.replace(/\u00A0/g, "&nbsp;").trim() ===
          e.replace(/\u00A0/g, "&nbsp;").trim();
  }
  function dt(t, e) {
    let o = x(t);
    o
      ? o.nodeValue !== e && (o.nodeValue = e)
      : t.textContent !== e && (t.textContent = e);
  }
  var v = new Map(),
    ft = 60 * 1e3,
    mt = "i18n:json:",
    gt = !1;
  function w(...t) {
    gt && console.log("[i18n json]", ...t);
  }
  function pt(t) {
    try {
      return JSON.parse(localStorage.getItem(t) || "null");
    } catch (e) {
      return null;
    }
  }
  function ht(t, e) {
    try {
      localStorage.setItem(t, JSON.stringify(e));
    } catch (o) {}
  }
  function yt(t) {
    return mt + t;
  }
  function bt(t, e) {
    return typeof t == "number" && Date.now() - t < e;
  }
  async function R(t, { ttlMs: e = ft, retries: o = 2 } = {}) {
    if (v.has(t)) return v.get(t);
    let n = yt(t),
      i = pt(n);
    if (i && bt(i.ts, e)) {
      w("HIT (persist)", { url: t, ageMs: Date.now() - i.ts });
      let s = Promise.resolve(i.data);
      return (v.set(t, s), s);
    }
    let r = (async () => {
      let s;
      for (let d = 0; d <= o; d++)
        try {
          w("FETCH", { url: t, attempt: d });
          let a = await fetch(t);
          if (a.status === 429) {
            let f = (d + 1) * 300;
            (w("429 backoff", { url: t, delay: f }),
              await new Promise((m) => setTimeout(m, f)));
            continue;
          }
          if (!a.ok) throw new Error(`HTTP ${a.status} for ${t}`);
          let c = await a.json();
          return (
            ht(n, { ts: Date.now(), data: c }),
            w("STORE (persist)", { url: t }),
            c
          );
        } catch (a) {
          if (((s = a), d < o)) {
            let c = (d + 1) * 200;
            (w("retry", { url: t, delay: c, error: String(a) }),
              await new Promise((f) => setTimeout(f, c)));
          }
        }
      if (i && i.data)
        return (
          w("FALLBACK (stale)", { url: t, ageMs: Date.now() - i.ts }),
          i.data
        );
      throw s;
    })();
    return (v.set(t, r), r);
  }
  var A = null;
  function z(t) {
    return A || ((A = R(t)), A);
  }
  var T = new Map();
  async function K(t, e) {
    if (T.has(e)) return T.get(e);
    let o = (async () => {
      let i = (await z(t))[`${e}.map`];
      if (!i) return null;
      let r = new URL(t, location.origin),
        s = new URL(i, r).toString();
      return R(s);
    })();
    return (T.set(e, o), o);
  }
  var _ = new Map();
  async function wt(t, e, o) {
    let n = await z(t),
      i = new URL(t, location.origin),
      r = (e || []).map((d) => {
        let a = `${d}:${o}`;
        if (_.has(a)) return _.get(a);
        let c = n[`${d}.${o}`];
        if (!c) return Promise.resolve({});
        let f = new URL(c, i).toString(),
          m = R(f);
        return (_.set(a, m), m);
      }),
      s = await Promise.all(r);
    return Object.assign({}, ...s);
  }
  function Q(t) {
    let e = new Map();
    if (!t) return e;
    for (let o of t
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)) {
      let [n, i] = o.split(":").map((r) => r.trim());
      n && i && e.set(n, i);
    }
    return e;
  }
  function vt(t) {
    return Array.from(t.entries())
      .sort(([e], [o]) => (e > o ? 1 : e < o ? -1 : 0))
      .map(([e, o]) => `${e}:${o}`)
      .join(",");
  }
  function Y(t, e = document) {
    for (let o of t || []) {
      let { selector: n, type: i, attr: r, key: s } = o || {};
      if (!n || !s) continue;
      let d = e.querySelectorAll(n);
      d.length &&
        d.forEach((a) => {
          if (i === "text" || i === "html")
            (a.getAttribute("data-i18n") !== s &&
              a.setAttribute("data-i18n", s),
              i === "html" && a.setAttribute("data-i18n-html", "true"));
          else if (i === "attr" && r) {
            let c = Q(a.getAttribute("data-i18n-attr"));
            c.set(r, s);
            let f = vt(c);
            a.getAttribute("data-i18n-attr") !== f &&
              a.setAttribute("data-i18n-attr", f);
          }
        });
    }
  }
  function At(t, e) {
    let o = t.getAttribute("data-i18n");
    if (o && e[o] != null) {
      let r = String(e[o]),
        s = `${o}\xA7${l.lang}\xA7${r.length}`;
      if (t.dataset.i18nApplied !== s) {
        if (t.hasAttribute("data-i18n-html"))
          lt(t.innerHTML, r) || (t.innerHTML = r);
        else {
          let d = r.replace(/&nbsp;/g, "\xA0"),
            a = x(t);
          (a ? a.nodeValue : t.textContent) !== d && dt(t, d);
        }
        t.dataset.i18nApplied = s;
      }
    }
    let n = t.getAttribute("data-i18n-attr");
    if (!n) return;
    let i = Q(n);
    for (let [r, s] of i) {
      if (!ut.has(r) || e[s] == null) continue;
      let d = String(e[s]);
      if (r === "data-i18n-text") {
        let a = d.replace(/&nbsp;/g, "\xA0"),
          c = x(t);
        (c ? c.nodeValue : "") !== a &&
          (c
            ? (c.nodeValue = a)
            : t.insertBefore(document.createTextNode(a), t.firstChild));
        continue;
      }
      ((r === "title" ||
        r === "aria-label" ||
        r === "placeholder" ||
        r === "value") &&
        (d = d.replace(/&nbsp;/g, "\xA0")),
        t.getAttribute(r) !== d && t.setAttribute(r, d));
    }
  }
  function X(t, e = document) {
    t &&
      e
        .querySelectorAll("[data-i18n],[data-i18n-attr]")
        .forEach((o) => At(o, t));
  }
  async function Z(t) {
    var r;
    if (!((r = l == null ? void 0 : l.opts) != null && r.manifestUrl))
      throw new Error("ThriveI18n not initialized: missing opts.manifestUrl");
    l.lang = I(t);
    try {
      localStorage.setItem(N, l.lang);
    } catch (s) {}
    let { manifestUrl: e, namespaces: o } = l.opts,
      n = await Promise.all(o.map((s) => K(e, s)));
    for (let s of n) Array.isArray(s) && Y(s, document);
    let i = await wt(e, o, l.lang);
    ((l.catalogs = i), (l.isApplying = !0));
    try {
      X(i);
    } finally {
      l.isApplying = !1;
    }
  }
  var P = !1,
    C = new Set();
  function V(t) {
    !t || t.nodeType !== 1 || (C.add(t), P || ((P = !0), queueMicrotask(Ct)));
  }
  async function Ct() {
    if (((P = !1), !C.size)) return;
    let t = Array.from(C);
    (C.clear(), (l.isApplying = !0));
    try {
      for (let e of t)
        for (let o of l.opts.namespaces) {
          let n = await K(l.opts.manifestUrl, o);
          n && Y(n, e);
        }
      for (let e of t) X(l.catalogs, e);
    } finally {
      l.isApplying = !1;
    }
  }
  async function O(t) {
    if (
      ((l.opts = Object.assign(
        { namespaces: ["profile"], observeMutations: !0, manifestUrl: "" },
        t || {},
      )),
      !l.opts.manifestUrl)
    )
      throw new Error("manifestUrl required");
    let e = I(localStorage.getItem(N) || "en");
    (J(e),
      await Z(e),
      (l.ready = !0),
      window.addEventListener("storage", (o) => {
        o.key === N && o.newValue && o.newValue !== l.lang && tt(o.newValue);
      }),
      l.opts.observeMutations &&
        (l.observer && l.observer.disconnect(),
        (l.observer = new MutationObserver((o) => {
          if (!l.isApplying)
            for (let n of o)
              n.type === "childList"
                ? n.addedNodes.forEach((i) => V(i))
                : n.type === "attributes" && V(n.target);
        })),
        l.observer.observe(document.documentElement, {
          subtree: !0,
          childList: !0,
          attributes: !0,
          attributeFilter: ["data-i18n", "data-i18n-attr", "data-i18n-html"],
        })));
  }
  async function tt(t) {
    if ((J(t), !l.ready)) {
      l.pending.push(t);
      return;
    }
    await Z(t);
  }
  function St(t) {
    var e;
    return (e = l.catalogs[t]) != null ? e : t;
  }
  function Lt(t, e) {
    return new Intl.NumberFormat(l.lang === "fr" ? "fr-CA" : "en-CA", e).format(
      t,
    );
  }
  function Et(t, e) {
    let o = t instanceof Date ? t : new Date(t);
    return new Intl.DateTimeFormat(
      l.lang === "fr" ? "fr-CA" : "en-CA",
      e,
    ).format(o);
  }
  function Mt() {
    var t;
    return {
      lang: l.lang,
      ready: l.ready,
      hasObserver: !!l.observer,
      namespaces: ((t = l.opts) == null ? void 0 : t.namespaces) || [],
      catalogKeys: Object.keys(l.catalogs).length,
    };
  }
  typeof window != "undefined" &&
    (window.ThriveI18n = {
      init: O,
      setLangNoReload: tt,
      t: St,
      fmtNumber: Lt,
      fmtDate: Et,
      __debug: Mt,
      get ready() {
        return l.ready;
      },
    });
  function Tt(t, e) {
    let o = e.toLowerCase();
    for (let [n, i] of t.searchParams.entries())
      if (n.toLowerCase() === o) return i;
    return null;
  }
  function D(t = location.href) {
    let e =
        typeof t == "string"
          ? new URL(t, location.origin)
          : t instanceof URL
            ? t
            : new URL(location.href),
      n =
        (e.pathname || "/")
          .replace(/\/{2,}/g, "/")
          .replace(/^\/sandboxmicrosite(?=\/|$)/i, "") || "/",
      i = (Tt(e, "section") || "").trim().toLowerCase(),
      r = new Set(["header"]),
      s = !0,
      d = new Set([
        "header",
        "profile",
        "login",
        "community",
        "networkMembers",
        "contact",
        "eventsCalendar",
        "accountResetPassword",
      ]),
      a = function (u) {
        if (!(!s || !u))
          for (var g = Array.isArray(u) ? u : [u], h = 0; h < g.length; h++) {
            var y = g[h];
            y && d.has(y) && r.add(y);
          }
      };
    ((/^\/profile\/?$/.test(n) || /^\/people(?:\/|$)/i.test(n)) && a("profile"),
      /^\/profile\/connections\/contacts(?:\/|$)/i.test(n) && a("connections"),
      /^\/profile\/connections\/communities(?:\/|$)/i.test(n) &&
        a("communities"),
      /^\/profile\/connections\/communitiesnode(?:\/|$)/i.test(n) &&
        a("communitiesNode"),
      /^\/profile\/connections\/following-connections(?:\/|$)/i.test(n) &&
        a("following"),
      /^\/profile\/contributions\/contributions-summary(?:\/|$)/i.test(n) &&
        a("contribSummary"),
      /^\/profile\/contributions\/contributions-achievements(?:\/|$)/i.test(
        n,
      ) && a("contribAchievements"),
      /^\/profile\/contributions\/contributions-list(?:\/|$)/i.test(n) &&
        a("contribList"),
      /^\/HigherLogic\/Security\/ResetPassword(?:\.aspx)?(?:\/|$|\?)/i.test(
        n,
      ) && a("accountResetPassword"),
      /^\/profile\/myaccount\/changepassword(?:\/|$)/i.test(n) &&
        a("accountChangePassword"),
      /^\/profile\/myaccount\/mysignature(?:\/|$)/i.test(n) &&
        a("accountSignature"),
      /^\/profile\/myaccount\/inbox(?:\/|$)/i.test(n) && a("accountInbox"),
      /^\/profile\/myaccount\/my-settings(?:\/|$)/i.test(n) &&
        a(
          {
            privacy: "accountSettingsPrivacy",
            email: "accountSettingsEmail",
            rssfeeds: "accountSettingsRss",
            subscriptions: "accountSettingsSubscriptions",
          }[i],
        ),
      /^\/network\/members(?:\/|$)/i.test(n) && a("networkMembers"),
      /^\/contactus(?:\/|$)/i.test(n) && a("contact"));
    let c = [
      /^\/login(?:\/|$)/i,
      /^\/higherlogic\/security\/agreement\.aspx(?:\/|$)/i,
      /^\/higherlogic\/security\/login(?:\.aspx)?(?:\/|$)/i,
    ];
    return (
      ((u = location) => c.some((g) => g.test(u.pathname)))() && a("login"),
      /^\/participate\/postmessage(?:\/|$)/i.test(n) && a("postMessage"),
      /^\/participate\/add-new-entry(?:\/|$)/i.test(n) && a("addLibrary"),
      /^\/events\/calendar(?:\/|$)/i.test(n) && a("eventsCalendar"),
      /^\/communities\/[^/]+(?:\/|$)/i.test(n) && a("community"),
      /^\/communities(?:\/community-home)?\/invite-community(?:\/digestviewer)?(?:\/|$)/i.test(
        n,
      ) && a("communityInvite"),
      /^\/communities\/community-home\/digestviewer(?:\/|$)/i.test(n) &&
        a("communityDigest"),
      /^\/communities\/community-home\/librarydocuments(?:\/|$)/i.test(n) &&
        a("communityLibrary"),
      /^\/communities\/community-home\/recent-community-events(?:\/|$)/i.test(
        n,
      ) && a("communityEvents"),
      /^\/communities\/community-home\/community-members(?:\/|$)/i.test(n) &&
        a("communityMembers"),
      Array.from(r)
    );
  }
  var ot = new Map(),
    et = null;
  function k() {
    return document.documentElement.getAttribute("data-lang") === "fr"
      ? "fr"
      : "en";
  }
  function F(t, e) {
    ot.set(t, e);
  }
  function $t(t) {
    let e = location.pathname.replace(/\/+$/, "") || "/";
    if (typeof t == "function") return !!t(location);
    if (t instanceof RegExp) return t.test(e);
    if (typeof t == "string") {
      let o = String(t).replace(/\/+$/, "") || "/";
      if (o.endsWith("/*")) {
        let n = o.slice(0, -1);
        return e === n.slice(0, -1) || e.startsWith(n);
      }
      return e === o;
    }
    return !1;
  }
  function _t() {
    for (let [t, e] of ot) if ($t(t)) return e;
    return null;
  }
  function nt() {
    (clearTimeout(et),
      (et = setTimeout(() => {
        let t = _t();
        t && t();
      }, 0)));
  }
  function at() {
    let t = () => nt();
    (document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", t, { once: !0 })
      : t(),
      window.addEventListener("langchange", () => nt()));
  }
  function b(t, e, o, n) {
    n = n || "langchange";
    function i() {
      try {
        return (
          (typeof k == "function" && k()) ||
          document.documentElement.lang ||
          "en"
        );
      } catch (u) {
        return document.documentElement.lang || "en";
      }
    }
    function r(u) {
      return (u || "").replace(/\s+/g, " ").trim();
    }
    function s(u) {
      var g = document.getElementById(t);
      if (g)
        for (var h = g.querySelectorAll("li"), y = 0; y < h.length; y++) {
          var p = h[y];
          p.dataset.i18nOrig || (p.dataset.i18nOrig = r(p.textContent));
          var S = p.dataset.i18nOrig,
            L = e[S];
          u === "fr" && L
            ? (p.textContent !== L && (p.textContent = L),
              (p.dataset.i18nApplied = "1"))
            : (p.textContent !== S && (p.textContent = S),
              (p.dataset.i18nApplied = ""));
        }
    }
    function d() {
      s(i());
    }
    var a = (o && document.getElementById(o)) || document.body;
    if (
      (document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", d, { once: !0 })
        : d(),
      window.addEventListener(n, function (u) {
        var g = (u && u.detail && (u.detail.lang || u.detail.locale)) || i();
        s(g);
      }),
      window.MutationObserver)
    ) {
      var c = new MutationObserver(d);
      c.observe(document.documentElement, {
        attributes: !0,
        attributeFilter: ["lang"],
      });
    }
    if (window.MutationObserver) {
      var f = new MutationObserver(d);
      f.observe(a, { childList: !0, subtree: !0, characterData: !0 });
    }
    if (window.Sys && Sys.WebForms && Sys.WebForms.PageRequestManager)
      try {
        var m = Sys.WebForms.PageRequestManager.getInstance();
        m.add_endRequest(d);
      } catch (u) {}
  }
  var Nt = {
      "Alberta (AB)": "Alberta (Alb.)",
      "British Columbia (BC)": "Colombie-Britannique (C.-B.)",
      "Manitoba (MB)": "Manitoba (Man.)",
      "New Brunswick (NB)": "Nouveau-Brunswick (N.-B.)",
      "Newfoundland and Labrador (NL)": "Terre-Neuve-et-Labrador (T.-N.-L.)",
      "Northwest Territories (NT)": "Territoires du Nord-Ouest (T.N.-O.)",
      "Nova Scotia (NS)": "Nouvelle-\xC9cosse (N.-\xC9.)",
      "Nunavut (NU)": "Nunavut (Nt)",
      "Ontario (ON)": "Ontario (Ont.)",
      "Prince Edward Island (PE)":
        "\xCEle-du-Prince-\xC9douard (\xCE.-P.-\xC9.)",
      "Quebec (QC)": "Qu\xE9bec (Qc)",
      "Saskatchewan (SK)": "Saskatchewan (Sask.)",
      "Yukon (YT)": "Yukon (Yn)",
      Other: "Autre",
      "Not Specified": "Non pr\xE9cis\xE9",
    },
    xt = {
      Other: "Autre",
      Academia: "Milieu universitaire",
      Consulting: "Consultation",
      "Federal government": "Gouvernement f\xE9d\xE9ral",
      Foundation: "Fondation",
      "Municipal government": "Administration municipale",
      "Non-profit sector": "Secteur sans but lucratif",
      "Private sector": "Secteur priv\xE9",
      "Provincial government": "Gouvernement provincial",
      "Not Specified": "Non pr\xE9cis\xE9",
    },
    Pt = {
      "Large urban (100,000 or more)":
        "Grande zone urbaine (100\u2009000 ou plus)",
      "Medium urban (30,000 to 99,999)":
        "Moyenne zone urbaine (30 000 \xE0 99 999)",
      "Small urban (less than 30,000)":
        "Petite zone urbaine (moins de 30\u2009000)",
      Northern: "Nord",
      Rural: "Rurale",
    },
    It = {
      "Tax-filing support (e.g. free tax clinics)":
        "Soutien \xE0 la d\xE9claration de revenus (p. ex. cliniques fiscales gratuites)",
      "Help accessing benefits": "Aide pour acc\xE9der aux prestations",
      "One-on-one financial coaching (e.g. financial goal setting and action planning)":
        "Encadrement financier individuel (p. ex., \xE9tablissement d'objectifs financiers et planification des actions)",
      "Financial counselling and problem solving (including debt management)":
        "Conseils financiers et r\xE9solution de probl\xE8mes (y compris la gestion de la dette)",
      "Financial education": "\xC9ducation financi\xE8re",
      None: "Aucun",
      Other: "Autre",
    },
    Rt = {
      "Access to ID": "Acc\xE8s \xE0 l'identifiant",
      "Banking Access Support": "Soutien pour l\u2019acc\xE8s bancaire",
      "Budget Counselling": "Conseils budg\xE9taires",
      "Consumer Advocacy": "Repr\xE9sentation des consommateurs",
      "Debt Management": "Gestion de la dette",
      "Eviction Prevention Loan Program":
        "Programme de pr\xEAts pour la pr\xE9vention des expulsions",
      "Housing or Homelessness Support":
        "Soutien en mati\xE8re de logement et d\u2019itin\xE9rance",
      "Income Support": "Soutien au revenu",
      "RDSP Info & Support": "Renseignements sur le REEI et soutien",
      "RESP Info & Support": "Renseignements sur le REEE et soutien",
      None: "Aucun",
      Other: "Autre",
    },
    Ot = { English: "Anglais", French: "Fran\xE7ais" },
    Dt = {
      "Older people, Elders, or Seniors (65+ years old)":
        "Personnes \xE2g\xE9es ou a\xEEn\xE9s (autochtones) (65 ans et plus)",
      "Youth (15-30 years old)": "Jeunes (entre 15 et 30 ans)",
      "Racialized people": "Personnes racialis\xE9es",
      "Black communities": "Communaut\xE9s noires",
      "Newcomers, Refugees, or Non-Status people":
        "Nouveaux arrivants, r\xE9fugi\xE9s ou Autochtones non inscrits",
      "First Nations, M\xE9tis, and Inuit":
        "Premi\xE8res Nations, M\xE9tis et Inuit",
      "Those living with disabilities": "Personnes en situation de handicap",
      "Those who are unhoused": "Personnes sans abri",
      "Those living on low incomes": "Personnes \xE0 faible revenu",
      Women: "Femmes",
      "2SLGBTQI+": "2ELGBTQI+",
      "Northern Communities": "Communaut\xE9s du Nord",
      "Rural or Remote Communities":
        "Communaut\xE9s rurales ou \xE9loign\xE9es",
      "Official language minority community":
        "Communaut\xE9 de langue officielle en situation minoritaire",
      Other: "Autre",
    };
  F(
    (t) =>
      t.pathname.startsWith("/people/") || t.pathname.startsWith("/profile"),
    function () {
      (b(
        "MainCopy_ctl32_ulDemographicItems",
        Nt,
        "MainCopy_ctl32_ContactDemographicUpdatePanel",
        "langchange",
      ),
        b(
          "MainCopy_ctl34_ulDemographicItems",
          Pt,
          "MainCopy_ctl34_ContactDemographicUpdatePanel",
          "langchange",
        ),
        b(
          "MainCopy_ctl36_ulDemographicItems",
          xt,
          "MainCopy_ctl36_ContactDemographicUpdatePanel",
          "langchange",
        ),
        b(
          "MainCopy_ctl41_ulDemographicItems",
          It,
          "MainCopy_ctl41_ContactDemographicUpdatePanel",
          "langchange",
        ),
        b(
          "MainCopy_ctl43_ulDemographicItems",
          Rt,
          "MainCopy_ctl43_ContactDemographicUpdatePanel",
          "langchange",
        ),
        b(
          "MainCopy_ctl45_ulDemographicItems",
          Ot,
          "MainCopy_ctl45_ContactDemographicUpdatePanel",
          "langchange",
        ),
        b(
          "MainCopy_ctl38_ulDemographicItems",
          Dt,
          "MainCopy_ctl38_ContactDemographicUpdatePanel",
          "langchange",
        ),
        setTimeout(() => {
          ($("#MainCopy_ctl32_lbDemographicItems").selectpicker("refresh"),
            $("#MainCopy_ctl36_lbDemographicItems").selectpicker("refresh"));
        }, 2e3));
    },
  );
  F(
    (t) => t.pathname.startsWith("/login"),
    function () {
      let e = window.jQuery;
      if (!e || !e.fn.selectpicker) return;
      let o = [
          "0bca3586-218f-43b3-b059-0199734a100b-select",
          "d4aedf2d-a642-4b70-81dd-0199734cd5a1-select",
          "7ef9a3b6-0f46-4dac-b38b-0199734efe10-select",
          "172d3906-c563-42c3-bff0-0199735b5682-select",
          "303063c6-1cd6-4d75-8e3b-0199735e0e0d-select",
          "eb4436bb-e703-484c-afc7-0199736d34bf-select",
          "820d636e-9fed-4604-869e-0199736e70b7-select",
        ],
        n = {
          en: "{0} items selected",
          fr: "{0} \xE9l\xE9ments s\xE9lectionn\xE9s",
        };
      function i(c) {
        var u;
        let f = (
          ((u = c == null ? void 0 : c.detail) == null ? void 0 : u.lang) || ""
        ).toLowerCase();
        return f
          ? f.startsWith("fr")
            ? "fr"
            : "en"
          : (document.documentElement.lang || "").toLowerCase().startsWith("fr")
            ? "fr"
            : "en";
      }
      function r(c) {
        let f = c.attr("title") || "Nothing selected";
        return (/^\(.*\)$/.test(f) && (f = f.slice(1, -1)), f);
      }
      function s(c, f) {
        let m = r(c),
          u = c.attr("data-count-selected-text") || n[f] || n.en,
          g = c.find("option:selected"),
          h = g.length;
        return h === 0
          ? m
          : h > 1
            ? u.replace("{0}", String(h))
            : g
                .map((y, p) => p.textContent.trim())
                .get()
                .join(", ");
      }
      function d(c, f) {
        let m = e(`[id="${c}"]`),
          u = e(`.bootstrap-select [data-id="${c}"]`);
        !m.length || !u.length || u.find(".filter-option").text(s(m, f));
      }
      function a() {
        let c = i(),
          f = n[c] || n.en;
        o.forEach((m) => {
          let u = e(`[id="${m}"]`);
          u.length &&
            (u.data("i18n-bound") ||
              (u.attr("data-count-selected-text", f),
              u.selectpicker("refresh"),
              d(m, c),
              u
                .off("changed.bs.select.i18n")
                .on("changed.bs.select.i18n", () => {
                  d(m, i());
                }),
              u.data("i18n-bound", !0)));
        });
      }
      (document.readyState === "loading"
        ? document.addEventListener(
            "DOMContentLoaded",
            () => setTimeout(a, 500),
            { once: !0 },
          )
        : setTimeout(a, 500),
        window.addEventListener("langchange", (c) => {
          let f = i(c);
          setTimeout(() => {
            o.forEach((m) => {
              let u = e(`[id="${m}"]`);
              u.length &&
                (u.attr("data-count-selected-text", n[f]),
                u.selectpicker("refresh"),
                d(m, f));
            });
          }, 0);
        }));
    },
  );
  F("/advisory-committee", function () {
    let e = document.querySelector("#PageTitleH1");
    if (!e) return;
    let o = {
        en: "Meet the Resilient Futures Advisory Committee",
        fr: "Rencontrez le comit\xE9 consultatif de l\u2019initiative Un avenir r\xE9silient",
      },
      n = o[k()] || o.en;
    e.textContent.trim() !== n && (e.textContent = n);
  });
  function it() {
    G();
    let t = D();
    (O({
      manifestUrl:
        "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
      namespaces: t,
      observeMutations: !0,
    }),
      at());
  }
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", it, { once: !0 })
    : it();
  window.i18nThrive = { pickNamespaces: D };
})();
