/* ─────────────────────────────────────────
   BROTHERS IN GAMING — Shared newsletter signup

   Renders the Buttondown subscribe form into <section id="newsletter">.
   Set BUTTONDOWN_USER to the account's username (the name in your
   buttondown.com/<username> archive URL) — nothing else needs editing.
───────────────────────────────────────── */
const BUTTONDOWN_USER = "vcatano";

const el = document.getElementById("newsletter");

if (el) {
  const action = `https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN_USER}`;

  el.innerHTML = `
    <h2>Subscribe to our newsletter</h2>
    <p>Get our latest posts on indie games and game design.</p>

    <form class="newsletter-form" action="${action}" method="post" target="popupwindow">
        <label class="visually-hidden" for="bd-email">Email address</label>
        <input id="bd-email" type="email" name="email" placeholder="you@example.com" autocomplete="email" required />
        <button class="btn" type="submit">Subscribe</button>
    </form>
  `;

  // Buttondown's confirmation lands in a popup so the reader keeps their place.
  el.querySelector(".newsletter-form").addEventListener("submit", () => {
    window.open(`https://buttondown.com/${BUTTONDOWN_USER}`, "popupwindow");
  });
}
