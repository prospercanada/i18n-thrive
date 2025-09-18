// run this to *test* https://community.prospercanada.org/profile, in the browser console

(() => {
  const rows = [
    {
      key: "profile.tabs.my-profile",
      en: "My Profile",
      fr: "Mon profil",
      selector: "#MainCopy_ctl27_ProfileLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.my-connections",
      en: "My Connections",
      fr: "Mes connexions",
      selector: "#MainCopy_ctl27_ConnectionsLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.my-connections@aria-label",
      en: "My Connections",
      fr: "Mes connexions",
      selector: "#MainCopy_ctl27_ConnectionsLink",
      type: "attr",
      attr: "aria-label",
    },
    {
      key: "profile.tabs.contacts",
      en: "Contacts",
      fr: "Contacts",
      selector: "#MainCopy_ctl27_ContactsLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.networks",
      en: "Networks",
      fr: "Réseaux",
      selector: "#MainCopy_ctl27_NetworksLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.communities",
      en: "Communities",
      fr: "Communautés",
      selector: "#MainCopy_ctl27_CommunitiesLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.following",
      en: "Following",
      fr: "Abonnements",
      selector: "#MainCopy_ctl27_FollowingLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.my-contributions",
      en: "My Contributions",
      fr: "Mes contributions",
      selector: "#MainCopy_ctl27_ContributionsLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.my-contributions@aria-label",
      en: "My Contributions",
      fr: "Mes contributions",
      selector: "#MainCopy_ctl27_ContributionsLink",
      type: "attr",
      attr: "aria-label",
    },
    {
      key: "profile.tabs.my-summary",
      en: "My Summary",
      fr: "Mon résumé",
      selector: "#MainCopy_ctl27_SummaryLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.my-achievements",
      en: "My Achievements",
      fr: "Mes réalisations",
      selector: "#MainCopy_ctl27_AchievementsLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.my-list-of-contributions",
      en: "My List of Contributions",
      fr: "Ma liste de contributions",
      selector: "#MainCopy_ctl27_ListOfContributionsLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.my-account",
      en: "My Account",
      fr: "Mon compte",
      selector: "#MainCopy_ctl27_AccountLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.my-account@aria-label",
      en: "My Account",
      fr: "Mon compte",
      selector: "#MainCopy_ctl27_AccountLink",
      type: "attr",
      attr: "aria-label",
    },
    {
      key: "profile.tabs.change-password",
      en: "Change Password",
      fr: "Changer le mot de passe",
      selector: "#MainCopy_ctl27_ChangePasswordLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.privacy-settings",
      en: "Privacy Settings",
      fr: "Paramètres de confidentialité",
      selector: "#MainCopy_ctl27_PrivacySettingsLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.email-preferences",
      en: "Email Preferences",
      fr: "Préférences de courriel",
      selector: "#MainCopy_ctl27_EmailPreferencesLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.rss-feeds",
      en: "RSS Feeds",
      fr: "Flux RSS",
      selector: "#MainCopy_ctl27_RSSFeedsLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.community-notifications",
      en: "Community Notifications",
      fr: "Notifications de la communauté",
      selector: "#MainCopy_ctl27_SubscriptionsLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.discussion-signature",
      en: "Discussion Signature",
      fr: "Signature des discussions",
      selector: "#MainCopy_ctl27_DiscussionSignatureLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.disable-my-account",
      en: "Disable My Account",
      fr: "Désactiver mon compte",
      selector: "#MainCopy_ctl27_DisableAccountLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.my-inbox",
      en: "My Inbox",
      fr: "Ma boîte de réception",
      selector: "#MainCopy_ctl27_InboxLink",
      type: "text",
      attr: "",
    },
    {
      key: "profile.tabs.my-inbox@aria-label",
      en: "My Inbox",
      fr: "Ma boîte de réception",
      selector: "#MainCopy_ctl27_InboxLink",
      type: "attr",
      attr: "aria-label",
    },
    {
      key: "profile.tabs.admin",
      en: "Admin",
      fr: "Admin",
      selector: "#MainCopy_ctl27_AdminLink",
      type: "text",
      attr: "",
    },

    {
      key: "modal.disable.header",
      en: "Disable My Account",
      fr: "Désactiver mon compte",
      selector: "#disableMyAccountModalTitle",
      type: "text",
      attr: "",
    },
    {
      key: "modal.disable.warning",
      en: "You are disabling your account on Prosper Canada Community. You will be logged out of the system and will no longer be able to log back in. Please contact gelward@prospercanada.org if you have any questions.",
      fr: "Vous désactivez votre compte sur la communauté de Prospérité Canada. Vous serez déconnecté et ne pourrez plus vous reconnecter. Veuillez contacter gelward@prospercanada.org si vous avez des questions.",
      selector: "#MainCopy_ctl27_pnlDisableMyAccount .modal-body .bg-warning",
      type: "text",
      attr: "",
    },
    {
      key: "modal.disable.reason",
      en: "Reason for disabling account",
      fr: "Raison de la désactivation du compte",
      selector: "label[for='textareaDisableMyAccountReason']",
      type: "text",
      attr: "",
    },
    {
      key: "modal.disable.btn-primary",
      en: "Disable My Account",
      fr: "Désactiver mon compte",
      selector: ".btn-disable-my-account",
      type: "text",
      attr: "",
    },
    {
      key: "modal.disable.btn-cancel",
      en: "Cancel",
      fr: "Annuler",
      selector:
        "#MainCopy_ctl27_pnlDisableMyAccount .modal-footer .btn.btn-default",
      type: "text",
      attr: "",
    },

    {
      key: "section.bio",
      en: "Bio",
      fr: "Biographie",
      selector: "#MainCopy_ctl29_TitleText",
      type: "text",
      attr: "",
    },
    {
      key: "section.education",
      en: "Education",
      fr: "Éducation",
      selector: "#MainCopy_ctl32_TitleText",
      type: "text",
      attr: "",
    },
    {
      key: "section.education.add",
      en: "Add",
      fr: "Ajouter",
      selector: "#MainCopy_ctl32_AddItem",
      type: "text",
      attr: "",
    },
    {
      key: "section.honors-awards",
      en: "Honors and Awards",
      fr: "Distinctions et prix",
      selector: "#MainCopy_ctl35_TitleText",
      type: "text",
      attr: "",
    },
    {
      key: "section.honors-awards.add",
      en: "Add",
      fr: "Ajouter",
      selector: "#MainCopy_ctl35_AddItem",
      type: "text",
      attr: "",
    },
  ];

  // read current lang from localStorage ?lang= or preferredLang
  function getLang() {
    const p = new URLSearchParams(location.search).get("lang");
    if (p === "fr" || p === "en") return p;
    const s = (localStorage.getItem("preferredLang") || "en").toLowerCase();
    return s === "fr" ? "fr" : "en";
  }

  function setFirstTextNode(el, value) {
    // replace only first meaningful text node to preserve icons/spans
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        return n.nodeValue && n.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.REJECT;
      },
    });
    const t = walker.nextNode();
    if (t) t.nodeValue = value;
    else el.textContent = value; // fallback
  }

  const lang = getLang();
  const count = { found: 0, applied: 0, missing: 0 };

  rows.forEach((r) => {
    const el = document.querySelector(r.selector);
    if (!el) {
      count.missing++;
      return;
    }

    if (r.type === "attr" && r.attr) {
      el.setAttribute(r.attr, lang === "fr" ? r.fr : r.en);
      count.applied++;
    } else {
      setFirstTextNode(el, lang === "fr" ? r.fr : r.en);
      count.applied++;
    }
    count.found++;
  });

  console.log(
    `[i18n test] lang=${lang} found=${count.found} applied=${count.applied} missing=${count.missing}`
  );
})();
