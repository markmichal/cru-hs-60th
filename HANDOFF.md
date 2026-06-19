# Handoff — Cru HS 60th Anniversary Site

## Status as of 2026-06-18

There are now **two working versions** of the site (same Google Sheet as the data source):
1. **GitHub Pages** (this repo) — the public site, fast, clean custom domain, no banner.
2. **Apps Script "Site 2"** — an all-Google-Workspace port (separate project, see below). Fully working; kept as a fallback in case Cru policy requires hosting to stay inside Google.

---

## Completed — GitHub Pages site (this repo, `index.html` unless noted)

- **Phase 1 — Staff Service & Locations view**: Locations nav tab, Staff Service tab loading, People profiles with service-journey chips, location detail pages with era-grouped rosters.
- **Phase 2 — Staff AI intake** (`intake.html`): PIN-gated (1951), paste notes → Claude parse → editable preview → append to Sheet with Approved=FALSE.
- **Locations map**: merged into the Locations tab — Leaflet/OpenStreetMap on top, city cards below; auto-geocoded via Nominatim.
- **History intake** (`history-intake.html`): PIN-gated (1951), for Tom — freeform ministry-history notes → Claude parse → editable preview (Title, Year, Location, People, Type, Story, On Timeline) → append to master timeline tab, Approved=FALSE. Story field is a full-width auto-growing row.
- **Apps Script reference** (`apps-script-reference.gs`): actions `saveSettings`, `parseNotes`, `addStints`, `parseHistory`, `addHistoryEvents`, plus photo auto-renaming (form-submit trigger + "Cru 60th" menu). Claude Haiku 4.5 via Anthropic API; key in Script Properties.
- **Hero redesign**: split layout (title/text beside the photo carousel, no text over the image); caption is just an outline "View this photo" button.
- **Clickable everywhere**: people, locations, and years in cards and the detail modal all navigate to related things (person profile / location page / year-filtered gallery).
- **Gallery search includes the year**; person profile's summary date/location "trail" removed (service journey is the single source of truth).
- **Social share preview**: Open Graph + Twitter Card meta tags.
- **Custom domain**: `CNAME` → `highschoolhistory.crutastic.com` (the `markmichal.github.io/cru-hs-60th/` URL still works too).

### GitHub site — owner actions still needed
1. Redeploy the live Apps Script from `apps-script-reference.gs` (Manage deployments → New version) so the History intake + photo-renaming actions are live.
2. Confirm `ANTHROPIC_API_KEY` is in Script Properties.
3. Smoke-test `intake.html` and `history-intake.html`.

### GitHub site URLs
- Site: https://highschoolhistory.crutastic.com (also https://markmichal.github.io/cru-hs-60th/)
- Staff intake: `/intake.html` · History intake: `/history-intake.html`

---

## Completed — Apps Script "Site 2" (the all-Google port)

- **Lives outside this repo**: a clasp project in a separate local folder (`~/cru-hs-60th-site2/`), managed with `clasp` (logged in as mark.michal@cru.org). Apps Script Script ID `1jaFv4uKKthgAKbNsyEImYIkI921CBPMxtcwY28ryYphLIoiiLAyVyxpJ`. Files: `Code.js` (server), `index.html`, `appsscript.json`.
- **Public URL** (now "Anyone, even anonymous"): `https://script.google.com/macros/s/AKfycbw21uOCZFyrj3dYPCyicleT_TzcxAt-yRNfdK46XaRt-pr2Mtdsmv2K_YIMBqFfcCko/exec`
- **Architecture**: page runs in the Apps Script sandbox, so it can't fetch the Sheet/geocoder directly — the server (`Code.js`) bridges it. `fetchAllData()` reads all four tabs in one parallel call; `geocodeLocations()` caches coordinates in Script Properties (persistent, shared); `doGet()` embeds the data into the page (templating) so there's no startup round-trip.
- **CRITICAL gotcha (cost us hours)**: Apps Script's HtmlService runs an old comment-stripper that does NOT understand ES6 template literals — it treats `//` inside *any* script string as a line comment and deletes the rest of the line. So **every `https://` (or any `//`) inside the inline `<script>` must be written `https:\/\/`**. Embedded data is placed as escaped TEXT in a hidden `<div>` (not inline JS) to dodge this.
- **Known quirks (inherent to Apps Script, not bugs)**: Google's "created by another user" banner shows for public visitors (unavoidable); no custom domain (long script.google.com URL); a small extra load latency vs GitHub Pages.

---

## In progress / pending decision
- **Hosting decision is with Cru (policy, not technical)**: can the public site live on GitHub Pages (outside Google), or must it stay inside Google (use Site 2)? Both versions are built and working, so we're not blocked either way.

---

## Next task — build `share.html`
A **public, photo-first AI story submission page**. Mark will paste the full build prompt in a **new session**. Expected to be a single static page in this repo (like `intake.html` / `history-intake.html`), but public-facing and oriented around uploading a photo + telling its story, with AI assistance. Details to come from the pasted prompt.
