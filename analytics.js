/* ─────────────────────────────────────────
   BROTHERS IN GAMING — Cookieless visit tracker
   Sends one anonymous "pageview" beacon to /collect on load, and a
   "duration" beacon when the visit ends. No cookies, no localStorage,
   no personal data. Never throws — analytics must not break the page.
───────────────────────────────────────── */
(function () {
  "use strict";

  var ENDPOINT = "/collect";

  // Random id for THIS pageview, so the server can attach a duration later.
  var vid =
    (window.crypto && crypto.randomUUID && crypto.randomUUID()) ||
    Date.now().toString(36) + Math.random().toString(36).slice(2);

  var start = Date.now();
  var ended = false;

  function send(payload) {
    try {
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, body);
      } else {
        fetch(ENDPOINT, { method: "POST", body: body, keepalive: true });
      }
    } catch (e) {
      /* ignore */
    }
  }

  // 1) Pageview
  send({
    t: "pv",
    vid: vid,
    p: location.pathname,
    r: document.referrer || "",
    tz: (function () {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      } catch (e) {
        return "";
      }
    })(),
    sw: window.screen ? window.screen.width : 0,
  });

  // 2) Duration when the tab is hidden / closed
  function end() {
    if (ended) return;
    ended = true;
    send({ t: "end", vid: vid, d: Date.now() - start });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") end();
  });
  window.addEventListener("pagehide", end);
})();
