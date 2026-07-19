/* ─────────────────────────────────────────
   BROTHERS IN GAMING — Shared newsletter signup

   Renders the Buttondown subscribe form into every element with the
   "newsletter" class (there can be more than one per page — e.g. a copy
   at the top of an article and another at the bottom).
   Set BUTTONDOWN_USER to the account's username (the name in your
   buttondown.com/<username> archive URL) — nothing else needs editing.
───────────────────────────────────────── */
const BUTTONDOWN_USER = "vcatano";

const newsletterMounts = document.querySelectorAll(".newsletter");

newsletterMounts.forEach((el, i) => {
  const action = `https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN_USER}`;
  // ids must stay unique when more than one form is on the page.
  const inputId = `bd-email-${i}`;

  el.innerHTML = `
    <h2>Subscribe to our newsletter</h2>
    <p>Get our latest posts on indie games and game design.</p>

    <form class="newsletter-form" action="${action}" method="post" target="popupwindow">
        <label class="visually-hidden" for="${inputId}">Email address</label>
        <input id="${inputId}" type="email" name="email" placeholder="you@example.com" autocomplete="email" required />
        <button class="btn" type="submit">Subscribe</button>
    </form>
  `;

  // Buttondown's confirmation lands in a popup so the reader keeps their place.
  el.querySelector(".newsletter-form").addEventListener("submit", () => {
    window.open(`https://buttondown.com/${BUTTONDOWN_USER}`, "popupwindow");
  });
});
