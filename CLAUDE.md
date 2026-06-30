# Cru High School 60th Anniversary Site

Single-file static website celebrating 60 years of Cru High School Ministry (1967–2027). Interactive timeline, filterable gallery, and people view, with all content served live from a Google Sheet.

## Architecture (do not break these connections)

- **index.html** — the entire site. No build step. Deployed via GitHub Pages from `main` branch root. Live at https://markmichal.github.io/cru-hs-60th/
- **Data source:** Google Sheet ID `1FqNAgRTQBfGzaGJM_R8oe6wcUScp-UCU9nPABli7BkE`, read client-side via the gviz JSON endpoint. The sheet is shared "Anyone with link → Viewer."
  - Tab `Cru HS 60th Anniversary Timeline (master)` — curated timeline content (16 seed milestones — placeholder history the team will replace with the real 1967–2027 timeline). NEVER rename this tab without updating CONFIG.MASTER_TAB.
  - Tab `Stories` — story/gallery rows the site reads (public share.html submissions; renamed from the old `Form Responses 2`). Targeted by tab NAME (CONFIG.FORM_TAB), and every column is read AND written by header name (case-insensitive substring), never by position — so columns can be reordered freely.
  - Tab `Site Settings` — key/value pairs for editable page text (written by the hidden editor).
  - **`Event` column** (on BOTH the master and `Stories` tabs, added by hand in the content spine) — an optional event-name tag, read by header name. Items sharing the same trimmed, non-blank value collapse into one event card / pop-out (see "Event grouping" below); blank = a standalone card. "Event" is a **grouping tag, not an item type** — the item Type set is Milestone · Photo · Flyer · Story · Video.
- **Moderation:** only rows with the `Approved` checkbox checked appear on the site. `On Timeline` checkbox additionally surfaces an item on the timeline strip (gallery shows everything approved). `Featured` checkbox additionally surfaces an approved photo in the hero carousel at the top of the page (overlay mode; title + story become the caption; oldest first; the carousel auto-advances and only activates when ≥1 photo is Featured, otherwise the hero stays the plain white headline). The max photo count (default 7, 1–12) and seconds-per-slide (default 6, 2–30) are editable in the hidden editor under "Top photo slider" (CONFIG.HERO_MAX / HERO_SECONDS defaults; clamped).
- **Public Google Form** (submissions): https://docs.google.com/forms/d/e/1FAIpQLSfkvfxs7Gcd7-mRBcBHg2f-kBIFS7wl5LKCUSTw6ukKicUQqg/viewform
- **Apps Script Web App** (bound to the Sheet) receives POSTs from the site's hidden editor (`action: "saveSettings"`) and writes to the Site Settings tab. URL is in CONFIG.SCRIPT_URL. PIN-gated; PIN must match in both the site CONFIG and the script.
- **Hidden editor:** faint dot bottom-left of the site → PIN (CONFIG.EDIT_PIN, currently 6060) → edit page text/buttons/hero image. Saves persist to the Site Settings tab for all visitors. Timeline/gallery CONTENT is edited directly in the spreadsheet, not in the site.

## Key code landmarks in index.html

- `CONFIG` object at top of the `<script>` — all IDs, URLs, PIN, and `ERAS` array.
- `ERAS: []` means automatic decades (1960s, 1970s…). The team may later switch to named eras: `[{name:"Founding Years", start:1965, end:1982}, ...]` — everything (tabs, filters, zoom) adapts automatically.
- `MAX_TRACK: 20` caps cards per timeline strip; era zoom shows up to 20 per era with milestones prioritized.
- `driveImg()` converts Google Drive share links to embeddable thumbnail URLs (`drive.google.com/thumbnail?id=...&sz=w1200`) — this is how all photos are served.
- `videoInfo()` turns a YouTube or Google Drive **link** in the optional `Video` column into an embedded player + thumbnail. Videos are never hosted/uploaded — only embedded, and the player loads lazily when a visitor opens the item. An item with type `Video` shows a play badge in the gallery and an inline iframe player in the detail modal; it appears under the auto-generated "Video" type chip. Add a video by adding a Sheet row with type `Video` and pasting a YouTube/Drive link in the `Video` column (a `Photo` link is optional — a custom thumbnail; otherwise the platform thumbnail is used).
- Column matching in `rowsToItems()` is by case-insensitive substring on header names (e.g. "photo" matches "Upload your photo or flyer"), so the form tab and master tab can have different column orders.
- **Event grouping** (`collapseEvents()`): each view collapses its ALREADY-FILTERED item list into a mix of single cards + event groups (2+ items sharing an `Event` value; a lone tagged item stays a single card). Group year = the agreed year, else the earliest (`console.warn` on disagreement). Wired into BOTH views on their post-filter lists — the timeline (`timelineItems()` → `renderTimeline`) and the Stories gallery (`applyFilters()` → `renderGallery`) — so the "{n} items" count and resolved year reflect what that view shows. Event cards (`eventCardHTML` / `timelineEventHTML` via `eventDeckLayers`): a stacked-deck look (sibling `.ev-layer` elements inside `.ev-stack`), a gold "{n} items" pill, photos rotating ~2s (`startEventRotators`, paused under `prefers-reduced-motion`), face text = event name + year + count. Clicking opens `openEventModal()` — ONE scrolling pop-out (reuses the modal overlay; no nested modal) listing each item's photo + story + people + per-item type label.
- **Photo lightbox** (`#imgLightbox` / `openLightbox` / `closeLightbox`), site-wide: clicking a real-photo image in the event pop-out OR the single-card modal opens a full-size overlay (z-index above the modal; backdrop / × / Esc-first close it without disturbing the underlying modal, scroll preserved). `driveImgSize(url, w)` requests a larger Drive thumbnail size; the "View full image" link opens it in a new tab. Only real photos carry `.lb-open` — video thumbnails and text-only items don't trigger it.

## Brand rules (Cru brand kit)

- Fonts: **Sora** (headlines, ExtraBold 800) + **Inter** (body). Loaded from Google Fonts.
- Primary palette: Yellow `#FFD000`, White, Gray `#DEDEDE`, Black. Secondary: Orange `#F08220`, Cyan `#00C3D8`, Turquoise `#007990`. Accents: Vermilion `#D34400`, Lemon `#FFE378`, Graphite `#585652`.
- Look: bright/white background, high contrast, yellow used strategically (highlighter block in hero, timeline spine, CTAs). Black footer band with yellow CTA is intentional contrast.

## Workflow

- Edit index.html → commit → push to `main` → GitHub Pages auto-rebuilds in ~1–2 min. No other deploy step.
- Content changes need no code: edit the spreadsheet, check Approved, refresh the site.
- The Apps Script source also lives in this repo as reference (`Code.gs` if present), but the live copy runs inside the Google Sheet (Extensions → Apps Script). Changing the live script requires re-deploying the Web App (Manage deployments → new version).

## Two-Machine Rules

- Repos must live in a plain local folder, never inside a Google Drive-synced folder — Drive can corrupt `.git` with conflict-copy files.
- Both repos currently live at `/Users/markmichal/MY DOCUMENTS/Projects/`.
- Run `git pull` at the start of every session, on whichever machine you're on.
- Commit and push before stopping so the other machine can pick up current work.
- `.env` and `.claude/` must always be in `.gitignore` and must never be committed.
- Each machine needs `git config --global user.name` and `user.email` set to `Mark Michal` / `mark.michal@cru.org` so commits attribute correctly.

## Staff Service & Locations (next feature — see FEATURE-staff-locations.md)

A new tab `Staff Service` records where staff served, one row per STINT (one person, one place, one time span). Columns: `Person Name | Location | Start Year | End Year | Role | Notes | Approved | Submitted By | Submitted At` (last two are internal provenance from the intake page — never displayed on the site). A person with three cities = three rows. The site aggregates: rows grouped by Person Name = that person's journey in chronological order; grouped by Location = that location's staff roster across eras. Years are stored as facts; eras are derived for display (decades now, CONFIG.ERAS later), same as the timeline. All fields except Person Name are optional — data will always be incomplete and that's fine; render what exists. Name consistency is enforced by human reviewers before approving rows, not by the system. Only Approved=TRUE rows appear on the site.

Person profiles should merge BOTH data sources: service journey (Staff Service tab) + items they're tagged in (People column of content tabs). A Locations view lists location cards (year span, people count, item count) linking to location pages that show the staff roster by era plus gallery items with a matching Location.

Planned phase 2: an intake page (PIN-gated like the editor) where information gatherers paste freeform notes; the page POSTs to the Apps Script, which calls an LLM API (key in Script Properties, never client-side) to parse notes into stint rows, returns them for preview/correction, then appends with Approved=FALSE.

## Owner context

Mark Michal, Innovation Director, Cru High School Ministry. The Google assets live in his Drive folder "Cru HS 60th Anniversary Site". Broader project planning happens in Claude chat (which has the Google Drive connectors); this repo is for site code iteration.
