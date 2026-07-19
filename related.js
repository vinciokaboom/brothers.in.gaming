/* ─────────────────────────────────────────
   BROTHERS IN GAMING — Related posts

   Renders a "Recent Posts" card grid into <section id="related-posts">
   at the end of each article, showing the 3 most recent OTHER posts
   (mirrors the Wix original's "Recent Posts / See All" block).

   POSTS is the single source of truth, newest first. When a new article
   is published, add it to the top of this list.
───────────────────────────────────────── */
(function () {
  const POSTS = [
    { slug: "designed-for-two", title: "Designed for Two: The Co-op Philosophy of Josef Fares", thumb: "/Assets/thumbs/thumb-designed-for-two.jpg", date: "February 23, 2026", datetime: "2026-02-23", read: "13 min read" },
    { slug: "bokura", title: "Bokura: The Japanese Indie Game That Traveled Beyond Japan", thumb: "/Assets/thumbs/thumb-bokura.jpg", date: "May 27, 2025", datetime: "2025-05-27", read: "14 min read" },
    { slug: "lorelei", title: "Lorelei and The Laser Eyes: An Indie Masterpiece", thumb: "/Assets/thumbs/thumb-lorelei.jpg", date: "March 10, 2025", datetime: "2025-03-10", read: "12 min read" },
    { slug: "balatro", title: "Balatro: How a solo developer sold more than 1M copies in one month", thumb: "/Assets/thumbs/thumb-balatro.jpg", date: "October 22, 2024", datetime: "2024-10-22", read: "20 min read" },
    { slug: "about-the-japanese-approach-and-what-the-west-can-learn-from-it", title: "Uncovering the Reasons Behind Japanese Companies' Success: Employee Value and the Kaizen (改善) Approach", thumb: "/Assets/thumbs/thumb-about-the-japanese-approach-and-what-the-west-can-learn-from-it.jpg", date: "July 10, 2024", datetime: "2024-07-10", read: "13 min read" },
    { slug: "interview-series-1-difficulty-vs-approachability", title: "Interview Series #1: Difficulty vs Approachability", thumb: "/Assets/thumbs/thumb-interview-series-1-difficulty-vs-approachability.jpg", date: "March 13, 2024", datetime: "2024-03-13", read: "15 min read" },
    { slug: "synesthesia-in-video-games", title: "Synesthesia in Video Games: A Look Into Tetsuya Mizuguchi's Game Design Philosophy", thumb: "/Assets/thumbs/thumb-synesthesia-in-video-games.jpg", date: "January 16, 2024", datetime: "2024-01-16", read: "13 min read" },
    { slug: "omori", title: "Omori: How streamers, narrative and art led an indie game to success", thumb: "/Assets/thumbs/thumb-omori.jpg", date: "May 31, 2023", datetime: "2023-05-31", read: "16 min read" },
    { slug: "welcome-to-our-gaming-blog", title: "Welcome to our gaming blog!", thumb: "/Assets/thumbs/thumb-welcome-to-our-gaming-blog.jpg", date: "May 30, 2023", datetime: "2023-05-30", read: "2 min read" },
  ];

  const mount = document.getElementById("related-posts");
  if (!mount) return;

  // Which post are we on? Strip a trailing slash and any ".html" suffix.
  const current = window.location.pathname
    .replace(/\/$/, "")
    .split("/")
    .pop()
    .replace(/\.html$/, "");

  const related = POSTS.filter((p) => p.slug !== current).slice(0, 3);
  if (!related.length) return;

  const cards = related
    .map(
      (p) => `
      <a class="post-card" href="/post/${p.slug}">
        <div class="post-card-thumb"><img src="${p.thumb}" alt="" loading="lazy" width="800" height="450" /></div>
        <div class="post-card-body">
          <h3 class="post-card-title">${p.title}</h3>
          <div class="post-card-meta"><time datetime="${p.datetime}">${p.date}</time><span class="sep">·</span>${p.read}</div>
        </div>
      </a>`
    )
    .join("");

  mount.innerHTML = `
    <div class="related-head">
      <h2>Recent posts</h2>
      <a class="related-all" href="/">See all →</a>
    </div>
    <div class="related-grid">${cards}</div>
  `;
})();
