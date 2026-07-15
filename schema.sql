/* Brothers in Gaming analytics — one row per pageview. Kept forever = your history.
   Block comments are used deliberately so this stays valid even if pasted as
   a single line into the D1 dashboard console. */
CREATE TABLE IF NOT EXISTS events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  ts              TEXT    NOT NULL,           /* ISO timestamp (UTC) */
  day             TEXT    NOT NULL,           /* YYYY-MM-DD (UTC) */
  vid             TEXT    NOT NULL,           /* per-pageview id (links the duration beacon) */
  visitor_hash    TEXT    NOT NULL,           /* cookieless, daily-rotating anonymous id */
  is_returning    INTEGER NOT NULL DEFAULT 0, /* 1 = seen earlier the same day */
  path            TEXT,
  referrer        TEXT,
  country         TEXT,                       /* from Cloudflare edge geo */
  region          TEXT,
  city            TEXT,
  timezone_edge   TEXT,                       /* Cloudflare's guess */
  timezone_client TEXT,                       /* browser-reported */
  screen_w        INTEGER,
  ua              TEXT,
  duration_ms     INTEGER                     /* filled in when the visit ends */
);

CREATE INDEX IF NOT EXISTS idx_events_day         ON events(day);
CREATE INDEX IF NOT EXISTS idx_events_vid         ON events(vid);
CREATE INDEX IF NOT EXISTS idx_events_day_visitor ON events(day, visitor_hash);
