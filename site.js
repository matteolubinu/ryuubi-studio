/* Ryuubi Studio */

/* ============================================================
   CONFIGURATION: the only place to edit before launch
   ============================================================ */
var CONFIG = {
  // Gumroad product links. While empty, the buttons show "Coming soon".
  gumroad: {
    "research-validation": "https://ryuubistudio.gumroad.com/l/research-validation",
    "design-system": "https://ryuubistudio.gumroad.com/l/design-system-architecture",
    "bundle": "https://ryuubistudio.gumroad.com/l/both-packs"
  },
  // Google Analytics 4 ID (e.g. "G-XXXXXXXXXX"). Empty = no tracking and no banner.
  gaMeasurementId: "G-03M5F9F53X",
  // true if Purchasing Power Parity is enabled in the Gumroad settings.
  ppp: false
};

var PRODUCTS = {
  "research-validation": { name: "Product research and validation", price: 9.99 },
  "design-system": { name: "Design system and architecture", price: 9.99 },
  "bundle": { name: "Both packs", price: 14.99 }
};

(function () {
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  /* ---------- Reveal on scroll ---------- */

  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Gumroad buttons ---------- */
  /* The HTML already ships with the real Gumroad link and "Buy" label for every
     live product, so a slow connection or blocked JS still shows a working button.
     This only has to step in for a product that ISN'T live yet (empty CONFIG entry). */

  document.querySelectorAll("[data-gumroad]").forEach(function (a) {
    var id = a.getAttribute("data-gumroad");
    var url = CONFIG.gumroad[id];
    var label = a.querySelector("[data-label]");
    if (url) {
      a.addEventListener("click", function () {
        var p = PRODUCTS[id];
        if (window.gtag && p) {
          window.gtag("event", "begin_checkout", { currency: "EUR", value: p.price, items: [{ item_id: id, item_name: p.name, price: p.price }] });
        }
      });
    } else {
      a.setAttribute("aria-disabled", "true");
      a.removeAttribute("href");
      if (label) label.textContent = "Coming soon on Gumroad";
      a.addEventListener("click", function (e) { e.preventDefault(); });
    }
  });
  if (CONFIG.ppp) document.querySelectorAll("[data-ppp]").forEach(function (el) { el.hidden = false; });

  /* ---------- Bundle price, read from PRODUCTS so it can't drift from the real price ---------- */

  document.querySelectorAll("[data-bundle-price]").forEach(function (el) {
    el.textContent = "€" + PRODUCTS.bundle.price;
  });

  /* ---------- Mobile buy bar ---------- */

  var buyCard = document.querySelector(".buy-card");
  var buybar = document.querySelector(".buybar");
  if (buyCard && buybar && "IntersectionObserver" in window) {
    var seen = false;
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      if (e.isIntersecting) seen = true;
      // Show it only after scrolling past the buy card, never before.
      var passed = !e.isIntersecting && e.boundingClientRect.top < 0;
      buybar.classList.toggle("show", seen && passed);
      buybar.setAttribute("aria-hidden", String(!(seen && passed)));
    }).observe(buyCard);
  }

  /* ---------- Consent and Google Analytics (loaded only after "Accept") ---------- */

  var gaId = CONFIG.gaMeasurementId;
  var banner = document.querySelector("[data-consent]");
  var settingsLinks = document.querySelectorAll("[data-cookie-settings]");

  function loadGA() {
    if (!gaId || window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", gaId);
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gaId);
    document.head.appendChild(s);
  }
  // Google can rewrite its cookies while the page unloads, so they are also cleared on load.
  function clearGACookies() {
    var host = location.hostname.split(".");
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (name.indexOf("_ga") !== 0) return;
      for (var i = 0; i < host.length; i++) {
        var domain = host.slice(i).join(".");
        document.cookie = name + "=; Max-Age=0; path=/; domain=" + domain;
        document.cookie = name + "=; Max-Age=0; path=/; domain=." + domain;
      }
      document.cookie = name + "=; Max-Age=0; path=/";
    });
  }
  function showBanner() { if (banner) { banner.hidden = false; requestAnimationFrame(function () { banner.classList.add("show"); }); } }
  function hideBanner() { if (banner) { banner.classList.remove("show"); setTimeout(function () { banner.hidden = true; }, 400); } }

  if (gaId) {
    settingsLinks.forEach(function (l) { l.hidden = false; l.addEventListener("click", showBanner); });
    var choice = store("analytics-consent");
    if (choice !== "granted") clearGACookies();
    if (choice === "granted") loadGA();
    else if (choice !== "denied") setTimeout(showBanner, 900);
    if (banner) {
      banner.querySelector("[data-accept]").addEventListener("click", function () { store("analytics-consent", "granted"); loadGA(); hideBanner(); });
      banner.querySelector("[data-reject]").addEventListener("click", function () {
        var wasGranted = store("analytics-consent") === "granted";
        store("analytics-consent", "denied");
        hideBanner();
        // Withdrawal: delete the _ga cookies and reload, so the Google script stops running.
        if (wasGranted) { clearGACookies(); location.reload(); }
      });
    }
  }
})();
