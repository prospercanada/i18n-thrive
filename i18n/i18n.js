// TODO Add this a s a script and link to it in Thrive
document.addEventListener("DOMContentLoaded", function () {
  // optional: only run on /people/* pages
  if (!/^\/people\//.test(location.pathname)) {
    console.log("[i18n] Not a people page, skipping init.");
    return;
  }

  ThriveI18n.init({
    manifestUrl:
      "https://prospercanada.github.io/i18n-thrive/i18n/manifest.json",
    namespaces: ["profile"], // load translations for profile
    observeMutations: true, // re-translate if Thrive adds DOM later
  });
});
