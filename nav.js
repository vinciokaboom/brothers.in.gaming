/* ─────────────────────────────────────────
   BROTHERS IN GAMING — Shared site navigation
   Edit NAV_LINKS below and every page that includes
   this script picks up the change automatically.
   Hrefs are root-relative so they also work from the
   /post/<slug> blog-post pages.
───────────────────────────────────────── */

(function () {
  const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "About us", href: "/about-us" },
  ];

  function buildNavLinks() {
    return NAV_LINKS.map(
      (link) => `<li><a href="${link.href}">${link.label}</a></li>`
    ).join("");
  }

  function buildNav() {
    return `
      <a href="/" class="nav-logo" aria-label="Brothers in Gaming — home"><img src="/Assets/logo.png" alt="Brothers in Gaming" /></a>
      <ul class="nav-links">
        ${buildNavLinks()}
      </ul>
    `;
  }

  // Adds an "active" class to whichever link matches the current page.
  function highlightActive(root) {
    // Normalise: treat "" and "/index.html" as "/".
    let current = window.location.pathname.replace(/\/index\.html$/, "/");
    if (current === "") current = "/";
    root.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === current) a.classList.add("active");
    });
  }

  function init() {
    const mount = document.getElementById("site-nav");
    if (!mount) return;
    mount.innerHTML = buildNav();
    highlightActive(mount);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
