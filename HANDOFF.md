# Handoff — Cru HS 60th Anniversary Site

## Status as of 2026-06-18

**Current direction: working from GitHub (this repo). Apps Script "Site 2" is shelved for now — but fully built and preserved, so it can be revived if Cru policy later requires all-Google hosting.**

There are two working versions of the site (same Google Sheet as the data source):
1. **GitHub Pages** (this repo) — the active/public site, fast, clean custom domain, no banner. **All new work happens here.**
2. **Apps Script "Site 2"** — an all-Google-Workspace port (separate project, see below). Fully working but **shelved for now**; kept as a fallback in case Cru policy requires hosting to stay inside Google.

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
- **Current lean (as of 2026-06-18): proceed on GitHub Pages.** Site 2 is likely to be abandoned for now, but is preserved and revivable if the policy answer changes. Treat GitHub as the source of truth for ongoing work.

---

## Completed — `share.html` (public story page, Stage 1)
A **public, photo-first AI story submission page** — no PIN. Single static page in this repo, same dependencies/brand as the intake pages but warmer, with big touch targets and large text for older users on tablets. Live path: `/share.html`. Top-to-bottom:
- **Welcome-video bar** — slim strip with a thumbnail + play overlay; opens the video in a lightbox (closes on X / backdrop / Esc). Reads `welcomeVideoUrl`, `welcomeVideoThumb`, `welcomeVideoLabel` from the **Site Settings** tab; if `welcomeVideoUrl` is empty the whole bar is hidden. These three keys were added to the hidden editor (`SETTINGS_SCHEMA` in `index.html`, section "Welcome video (Share page)") so they're editable without code.
- **Collapsed service-history panel** — name field + textarea (with mic) → "Map my journey" (`parseServiceText`) → editable Location/Start/End/Role table → "Submit my service history" (`addServiceFromPublic`) appends to **Staff Service** (Approved=FALSE, Person Name + Submitted By = their name). Collapses to a ✓ on success.
- **Media hero** — big "Add a Photo" upload (image/video) OR "paste a link". Uploads go through `uploadStoryMedia` → saved to a Drive **"Story Uploads"** folder → returns a `driveImg()`-compatible link. Shows an inline preview.
- **Story** — warm textarea + a mic button that uses `webkitSpeechRecognition`, shown **only** where the browser supports it (feature-detected; hidden otherwise — e.g. Firefox).
- **Verify + submit** — "Share this story" (`parseStoryText`) → editable preview (Title/Year/Location/People/Type/Story) → final submit (`addStoryFromPublic`) appends to **Form Responses 2** (Approved=FALSE, On Timeline=FALSE, Submitted By = name). Photo link → Photo column; video link → Video column + a "Watch the video" button. Encourages-but-never-requires a photo (gentle nudge with a "Continue without a photo" option).
- **Apps Script** (`apps-script-reference.gs`): five new public actions added (`parseServiceText`, `addServiceFromPublic`, `uploadStoryMedia`, `parseStoryText`, `addStoryFromPublic`), all using Claude Haiku 4.5 + the existing `ANTHROPIC_API_KEY`. All existing actions intact. No PIN on the public actions; text/file-size caps as light abuse guards.

**Verified locally:** page loads with no console errors; the mic shows when supported and hides when not; the welcome bar stays hidden while `welcomeVideoUrl` is empty; service expand, video-link detection, and the no-photo nudge all work.

### Stage 1.1 refinements (2026-06-23)
- **Name + email now required** to send a story. Added a "Your email" field beside "Your name" in the story area; both are hard-required (clear inline red errors block "Share this story" until name is filled and email looks valid — contains `@` and a domain). Year/location/people are NOT required.
- **Email is stored.** `addStoryFromPublic` writes the submitter's email to an **Email** column in Form Responses 2 (created if missing).
- **Server-side timestamp.** `addStoryFromPublic` stamps the current date/time (generated in Apps Script, never the browser) into the existing **Submitted At** and/or **Timestamp** column, matched by header substring. Service rows already stamp Submitted At server-side.
- **Pre-fill on repeat.** "Share another" no longer reloads — it clears the story/photo/preview but **keeps the name + email** filled for the session (in-page state; no localStorage, which is blocked here).
- **Red attention-prompts on the verify step** for Year / Location / People: a soft muted helper sits above each field always; on a submit attempt with any empty, those turn **red + insistent** and the box is flagged, and the button becomes "Share anyway". The red clears the instant they type. These three never block submission (the story still goes through).
- Verified locally: required name+email gating, invalid-email block, error-clear-on-type, the encourage red prompts + "Share anyway", and name/email pre-fill on "Share another" all work; no console errors.

### Stage 1.2 refinements (2026-06-23)
- **Verify-step layout cleanup (share.html).** On the "Does this look right?" preview, every label now sits directly above its input and the two columns line up (Title/Year row and Location/People row). Removed the icon + above-box helper sentences (calendar/pin/people emoji) for Year/Location/People. The guidance now lives as light-gray placeholder text **inside** each box — Year: "Tell us the year if you can"; Location: "Where did this happen?"; People: "Names, separated by commas".
- **Red empty-prompt kept, just cleaner.** If Year/Location/People are empty on a submit attempt, a clean red prompt appears **below** the box (no icons) and the box is flagged, the button becomes "Share anyway", and the message bar still says it's fine to send as-is. Still never blocks submission; the red clears the instant they type. Verified locally (preview): alignment, placeholders, red prompts on empty-submit, clear-on-type, and "Share anyway" all work; no console errors.
- **Column mapping fix (Form Responses 2).** `addStoryFromPublic` now writes the submitter's NAME to the form's existing **"Your name"** column and the server-side timestamp to the form's existing **"Timestamp"** column (both matched by header substring). It **no longer** writes separate "Submitted By" / "Submitted At" columns on Form Responses 2 (those duplicated the form's own columns). The **Email** column and server-side timestamping behavior are unchanged. **Staff Service is untouched** — its Submitted By / Submitted At stay as intentional provenance.
- **Type dropdown: Video replaces Story (share.html).** The verify-step Type select now lists **Photo / Flyer / Video / Event** (was …/Story/…); the AI-parse fallback defaults to Photo. Added "Video" to `EVENT_TYPES` in the Apps Script so a manually-chosen Video persists through `normType` instead of collapsing to "Event" (Story is kept server-side for the history-intake/timeline path).
- **Site CTA buttons now point to share.html.** Both "Share Your Story" submit buttons (header `submitBtn` + footer `footerSubmit`) in `index.html` now go to our own in-site story page instead of the old Google Form. `CONFIG.FORM_URL` default is now `share.html`, and a new `storySubmitUrl()` helper **ignores any saved Google-Form URL** in the Site Settings tab so the buttons always land on share.html (the live setting still pointed at the old form — this neutralizes it without needing an editor change). Internal pages navigate in the **same tab**; an external custom URL would still open in a new tab. The **"Suggest a correction" button is unchanged** (still its own correction Google Form). No Apps Script redeploy needed for this — it's all client-side in index.html.

### share.html — owner actions still needed
1. **Redeploy the Apps Script** from `apps-script-reference.gs` (Manage deployments → New version) so the public actions — **including the email + server-timestamp behavior and the new Your name / Timestamp column mapping** — go live. Until then the page's buttons will error. Same web app URL. (See the dated ">>> CHANGED 2026-06-23" note at the top of the .gs.)
   - **After redeploying**, submit one test story and confirm it lands in the **Your name** + **Timestamp** columns of Form Responses 2. Then you may **delete the now-unused "Submitted By" / "Submitted At" columns** from Form Responses 2 — they are no longer written or read for that tab (index.html never displays them; only Staff Service uses those header names, on its own tab). Leave Staff Service's columns alone.
2. First photo upload creates the **"Story Uploads"** Drive folder and prompts for a Drive permission — approve it. Then set that folder's sharing to **Anyone with link → Viewer** (see SETUP note F at the top of the .gs).
3. Optionally set `welcomeVideoUrl` (+ thumb/label) in the hidden editor (PIN 6060) to switch on the welcome bar.
4. Smoke-test `/share.html` end to end after redeploy.

### Stage 2 (later)
Photo **auto-renaming** for public uploads (mirror the existing form-submit renamer), and any polish from real-world testing.

## Earlier next task (now done) — build `share.html`
Built as Stage 1 above. Stage 2 (auto-rename) remains.
