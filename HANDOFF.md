# Handoff — Cru HS 60th Anniversary Site

> **WHERE WE ARE (2026-06-25).** Front-end batch + identity shift landed in `index.html`, plus a one-time data-cleanup utility in `apps-script-reference.gs`. The site is shifting from a one-time 60th-anniversary site to a permanent **"Cru High School History"** living archive. A later same-day pass added three more pure-front-end tweaks (share.html scroll fix, filter-bar layout, bigger logo) that need **no redeploy** — see "2026-06-25 (later) — three front-end tweaks". See "2026-06-25 — front-end batch + identity shift" for the identity work. **Owner actions remaining (from the identity batch — the later tweaks add none):**
> 1. **Paste the updated `apps-script-reference.gs` into the Sheet's Apps Script editor** (Extensions → Apps Script → select all → paste → Save), then **run `convertStoryTypeToPhoto()` ONCE** — pick it from the function dropdown and Run, or use the Sheet's **"Cru 60th" menu → "Convert Story type → Photo"**. This rewrites any `Type = "Story"` rows on the Stories tab to `Photo`. (This utility is editor/menu-only — it does **not** by itself need a web-app redeploy.)
> 2. **Redeploy a NEW web-app version** only if the **Stage 2 auto-rename** (the 2026-06-24 change) isn't live yet — pasting the file above also carries it. If you already redeployed Stage 2, no redeploy is needed for this batch.
> 3. **Eyeball the live site** after the Pages rebuild (~1–2 min): the logo sits cleanly in the yellow badge, the header reads "Cru High School History" with the new tagline, the nav reads Timeline · Stories · People · Locations, and the gallery's decade buttons filter correctly alongside type/search/location/person.
>
> **Note on editable text:** the header title, subtitle, and nav labels are still editable via the hidden editor → Site Settings tab. The HTML defaults were updated, but **if a saved Site Settings value exists for `headerTitle` / `headerSubtitle` / `navGallery`, that saved value wins** and the old text may still show — clear/update it in the hidden editor (PIN 6060) if so.
>
> Prior state (still true): the owner did the `Form Responses 2` → `Stories` tab rename and the Stage 1.2 / 1.3 / structural-pass redeploys, so those server changes are live.

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

### Stage 1.3 — structural pass (2026-06-23)
*A coordinated code + Sheet change. The code is live in index.html; the owner must rename the Sheet tab and redeploy the Apps Script — see the checklist below.*
- **Tab renamed "Form Responses 2" → "Stories".** The site reads story/gallery rows from this tab. Updated **everywhere**: `CONFIG.FORM_TAB` in `index.html` (the gviz fetch), `FORM_TAB` in `apps-script-reference.gs` (story writes + the photo-renamer), and all doc comments. No other page references the tab name (the intake pages POST actions handled server-side). The owner renames the actual Sheet tab by hand; the code now looks for **"Stories"**.
- **All writes are now BY HEADER NAME, never by position.** This was the core bug — the owner had moved Approved / On Timeline / Featured to the far left, so position-based writes landed names in the Approved column. A shared `colMapper_()` helper reads each tab's header row and finds every target column by case-insensitive substring. Applied to **every** intake/append handler: staff intake (`addStints`), history intake (`addHistoryEvents`), and the public share.html actions (`addServiceFromPublic`, `addStoryFromPublic`). The owner can now reorder columns freely without breaking writes. (Reads in index.html — `rowsToItems`/`rowsToStints` — were already header-name based.)
- **New submissions insert at the TOP (row 2), newest first**, on Stories, Staff Service, and the master timeline (shared `insertTopRows_()`), so the newest items are visible first in the Sheet.
- **Approved defaults to the literal "FALSE"** (not blank, not a boolean) on every new incoming row, plus **On Timeline = FALSE** and **Featured = FALSE** where those columns exist — so the owner's red conditional formatting flags new rows as needing review. (`addStoryFromPublic` writes Approved/On Timeline/Featured = "FALSE"; the timeline keeps the parsed On Timeline value as "TRUE"/"FALSE".)
- **No tabs deleted** — the owner handles tab cleanup. Verified locally: `apps-script-reference.gs` passes a JS syntax check; index.html loads the live Sheet with no console errors and `CONFIG.FORM_TAB === "Stories"`.

### ⭐ Owner checklist for the structural pass (do in this order)
1. **Rename the Sheet tab** from **"Form Responses 2"** to **"Stories"** (double-click the tab name at the bottom of the spreadsheet). Exact spelling, no trailing spaces.
2. **Paste the updated `apps-script-reference.gs`** into Extensions → Apps Script (select all, delete, paste, Save), then **Deploy → Manage deployments → New version → Deploy** (same web app URL).
3. **Confirm the gallery still loads** at https://highschoolhistory.crutastic.com after the rename (the "Live from Google Sheets — N approved items" status should still appear and show your story items).
4. **Submit one test story** via `/share.html` and confirm the new row appears **at the top (row 2)** of the Stories tab, with **Approved = FALSE** (red), and the name/timestamp in **Your name** / **Timestamp**.
5. (Optional) Test the staff/history intakes and the public "Map my journey" the same way — new rows should also land at the top with Approved = FALSE.
6. Reorder columns however you like — writes will keep landing in the right columns by header name.

### share.html — owner actions still needed
1. **Redeploy the Apps Script** from `apps-script-reference.gs` (Manage deployments → New version) so the public actions — **including the email + server-timestamp behavior and the new Your name / Timestamp column mapping** — go live. Until then the page's buttons will error. Same web app URL. (See the dated ">>> CHANGED 2026-06-23" note at the top of the .gs.)
   - **After redeploying**, submit one test story and confirm it lands in the **Your name** + **Timestamp** columns of the **Stories** tab. Then you may **delete the now-unused "Submitted By" / "Submitted At" columns** from Stories — they are no longer written or read for that tab (index.html never displays them; only Staff Service uses those header names, on its own tab). Leave Staff Service's columns alone.
2. First photo upload creates the **"Story Uploads"** Drive folder and prompts for a Drive permission — approve it. Then set that folder's sharing to **Anyone with link → Viewer** (see SETUP note F at the top of the .gs).
3. Optionally set `welcomeVideoUrl` (+ thumb/label) in the hidden editor (PIN 6060) to switch on the welcome bar.
4. Smoke-test `/share.html` end to end after redeploy.

### Stage 2 (2026-06-24) — DONE (pending redeploy)
Photo/video **auto-renaming** for public share.html uploads now mirrors the existing form-submit renamer. Implemented entirely in `apps-script-reference.gs`:
- A new `renameStoryUpload_()` helper renames the just-uploaded Drive file to the same clean **"Year — Title — People.ext"** convention the Google-Form path uses (reusing the existing `buildPhotoName` / `renamePhotoFile` / `driveFileIds` / `fileExt` helpers).
- It's called at the **end of `addStoryFromPublic`**, *after* the row is written (so a rename hiccup can never lose a submission) and wrapped in try/catch. The rename is done at submit time, not upload time, because the Title/Year/People aren't known when `uploadStoryMedia` first saves the file.
- Only files in the owner's **"Story Uploads"** Drive folder are touched; pasted **YouTube/external links no-op** (`driveFileIds` finds no ID to rename). Works for both photo and video uploads (`fileExt` now also maps mp4/mov/webm).
- **No new trigger or permission** beyond the Drive access already approved for "Story Uploads". No index.html/share.html change — server-side only.
- Verified locally: `apps-script-reference.gs` passes `node --check` (via a .js copy). **Owner action: one redeploy** of the Apps Script (Manage deployments → New version, same URL) to make it live — see the ">>> CHANGED 2026-06-24" note at the top of the .gs. After redeploy, submit a test story with a photo on `/share.html` and confirm the file in the "Story Uploads" Drive folder is renamed to "Year — Title — People".

*Remaining:* any polish from real-world testing.

## 2026-06-25 (later) — three front-end tweaks (no redeploy)
Pure front-end, `index.html` + `share.html` only. No Apps Script change, no redeploy — these go live on the next Pages rebuild with no owner action beyond eyeballing.
- **share.html "Share another" scroll fix.** The share-another handler ended with `window.scrollTo({top:0})` followed by `$("storyText").focus()` — the focus call yanked the viewport back down to the story textarea. Replaced both with `$("mediaCard").scrollIntoView({block:"start"})` and removed the focus, so clicking "share another" lands at the TOP of the "Share a photo, flyer, or video" section (the Add a Photo button), matching the form's natural top-to-bottom flow.
- **Gallery/Stories filter-bar layout.** Top-to-bottom order is now: decade bar → three equal-width controls → type buttons → cards. The `.filter-bar` is a 3-column CSS grid (`repeat(3,1fr)`) holding the search box, "All locations", and "All people" — each exactly one-third, stacking to full width below 560px. The search placeholder is shortened to "Search titles and stories…" (it still searches location/people/year under the hood). The type chips moved to their own `.type-chips-row` below the three controls, with "Clear all" pushed to the right of that row. The decade bar (`#galleryDecades`) was moved above the controls to match the requested order.
- **Logo badge 50% larger.** `.badge-60 img` went from `width/height: 66%` to `95%`. Safe because the cru+ artwork has generous built-in whitespace, so the visible mark still sits cleanly inside the circle with padding.

*Verified:* both files' inline `<script>` blocks parse clean (vm); landmark grep confirms each change and that the only remaining `storyText.focus()` is an unrelated empty-field validation. Verified statically — the Claude Preview panel is rooted at a different project, so eyeball the live site after the Pages rebuild.

## 2026-06-25 — front-end batch + identity shift
A batch of `index.html` front-end changes (modify-not-rebuild) plus one `apps-script-reference.gs` data utility. The repo is no longer framed only as the one-time 60th anniversary; it's becoming a permanent **living history archive**.

- **Gallery decade filter bar (new).** Above the gallery cards there's now a row of decade buttons reusing the timeline's `.era-tab` styling: **"All Decades"** (default/active) plus one button per decade that actually has items (computed from `decadeOf(d.year)` over the approved `DATA`, so empty decades never show). Clicking a decade filters to items whose Year falls in it (1990s = 1990–1999); items with a blank year appear only under "All Decades". Implemented as a new `filters.decade` field (replacing the old `filters.era`), matched in `applyFilters` via `decadeOf`. It composes with the existing type/search/location/person filters. The decade buttons live in `#galleryDecades`; because they share the `.era-tab` class with the timeline, the click handler checks `e.target.closest("#galleryDecades .era-tab")` **before** the timeline's generic `.era-tab` handler and returns early, so the two don't collide.
- **Removed the "All Eras" dropdown** (`#decadeFilter` `<select>`) from the gallery filter bar — the decade buttons replace it. Its change-listener and all `$("decadeFilter")` references were removed.
- **Nav "Gallery" → "Stories".** Label only; the button keeps `data-view="gallery"` (same view/function) and `data-set="navGallery"` (still editable via Site Settings). Nav now reads Timeline · Stories · People · Locations.
- **Removed the "Story" type chip.** `buildFilterOptions` filters `Type === "story"` (case-insensitive) out of the type chips, leaving Milestone / Flyer / Photo / Event / Video.
- **`convertStoryTypeToPhoto()` (Apps Script, new).** One-time MANUAL utility — not automatic, no trigger. Walks the Stories tab (Type column matched by header name) and changes every `Story` to `Photo`. Re-runnable safely. Added to the "Cru 60th" menu too. **Owner runs it once** (see the checklist at the top). It's editor/menu-only and doesn't itself require a web-app redeploy.
- **Identity shift (#6).** Browser `<title>`, `og:title`, and `twitter:title` → **"Cru High School History"** (the "60 Years of Stories" tagline removed). Header `<h1>` default → "Cru High School History"; subtitle default → "How God has used Cru in the lives of teenagers". Title/subtitle/nav stay editable via Site Settings (caveat about saved-value overrides is in the top status block). The og/twitter **descriptions** (which mention "sixty years of moments…") were left as-is — they're descriptive prose, not the retired tagline.
- **Logo badge (#7).** The yellow circle badge now holds `cru-logo.png` (committed to the repo) instead of the "60" text — `<div class="badge-60"><img src="cru-logo.png" alt="Cru logo"></div>`, sized at 66% with `object-fit: contain` and the circle `overflow: hidden` so it sits centered with padding. The now-unused `badgeText` entry was removed from the editor's `SETTINGS_SCHEMA`.
- **Hero unchanged (#8).** The hero line "Sixty years of reaching teenagers with the gospel." is deliberately kept — sixty-years framing was only removed from the header/title/tab.
- **Verified:** all inline `<script>` blocks in `index.html` parse clean (vm syntax check); `apps-script-reference.gs` passes `node --check`; landmark grep confirms every change is present and the old dropdown/`filters.era` references are gone. The Claude Preview panel is rooted at a *different* project (the AI Research Site) and the site renders from a live Google Sheet, so this was verified by static analysis rather than the browser preview — the owner should eyeball the live site after the Pages rebuild (checklist item 3 up top).

## Earlier next task (now done) — build `share.html`
Built as Stage 1 above. Stage 2 (auto-rename) remains.
