# Cru High School 60th Anniversary Site

Single-file static website celebrating 60 years of Cru High School Ministry (1967–2027). Interactive timeline, filterable gallery, and people view, with all content served live from a Google Sheet.

## Architecture (do not break these connections)

- **index.html** — the entire site. No build step. Deployed via GitHub Pages from `main` branch root. Live at https://markmichal.github.io/cru-hs-60th/
- **Data source:** Google Sheet ID `1FqNAgRTQBfGzaGJM_R8oe6wcUScp-UCU9nPABli7BkE`, read client-side via the gviz JSON endpoint. The sheet is shared "Anyone with link → Viewer."
  - Tab `Cru HS 60th Anniversary Timeline (master)` — curated timeline content (16 seed milestones). NEVER rename this tab without updating CONFIG.MASTER_TAB.
  - Tab `Form Responses 2` — public submissions from the linked Google Form. Note: this is the FIRST tab in the spreadsheet (Google inserts form tabs leftmost), which is why the site targets tabs by name, never by position.
  - Tab `Site Settings` — key/value pairs for editable page text (written by the hidden editor).
- **Moderation:** only rows with the `Approved` checkbox checked appear on the site. `On Timeline` checkbox additionally surfaces an item on the timeline strip (gallery shows everything approved).
- **Public Google Form** (submissions): https://docs.google.com/forms/d/e/1FAIpQLSfkvfxs7Gcd7-mRBcBHg2f-kBIFS7wl5LKCUSTw6ukKicUQqg/viewform
- **Apps Script Web App** (bound to the Sheet) receives POSTs from the site's hidden editor (`action: "saveSettings"`) and writes to the Site Settings tab. URL is in CONFIG.SCRIPT_URL. PIN-gated; PIN must match in both the site CONFIG and the script.
- **Hidden editor:** faint dot bottom-left of the site → PIN (CONFIG.EDIT_PIN, currently 6060) → edit page text/buttons/hero image. Saves persist to the Site Settings tab for all visitors. Timeline/gallery CONTENT is edited directly in the spreadsheet, not in the site.

## Key code landmarks in index.html

- `CONFIG` object at top of the `<script>` — all IDs, URLs, PIN, and `ERAS` array.
- `ERAS: []` means automatic decades (1960s, 1970s…). The team may later switch to named eras: `[{name:"Founding Years", start:1965, end:1982}, ...]` — everything (tabs, filters, zoom) adapts automatically.
- `MAX_TRACK: 20` caps cards per timeline strip; era zoom shows up to 20 per era with milestones prioritized.
- `driveImg()` converts Google Drive share links to embeddable thumbnail URLs (`drive.google.com/thumbnail?id=...&sz=w1200`) — this is how all photos are served.
- Column matching in `rowsToItems()` is by case-insensitive substring on header names (e.g. "photo" matches "Upload your photo or flyer"), so the form tab and master tab can have different column orders.

## Brand rules (Cru brand kit)

- Fonts: **Sora** (headlines, ExtraBold 800) + **Inter** (body). Loaded from Google Fonts.
- Primary palette: Yellow `#FFD000`, White, Gray `#DEDEDE`, Black. Secondary: Orange `#F08220`, Cyan `#00C3D8`, Turquoise `#007990`. Accents: Vermilion `#D34400`, Lemon `#FFE378`, Graphite `#585652`.
- Look: bright/white background, high contrast, yellow used strategically (highlighter block in hero, timeline spine, CTAs). Black footer band with yellow CTA is intentional contrast.

## Workflow

- Edit index.html → commit → push to `main` → GitHub Pages auto-rebuilds in ~1–2 min. No other deploy step.
- Content changes need no code: edit the spreadsheet, check Approved, refresh the site.
- The Apps Script source also lives in this repo as reference (`Code.gs` if present), but the live copy runs inside the Google Sheet (Extensions → Apps Script). Changing the live script requires re-deploying the Web App (Manage deployments → new version).

## Owner context

Mark Michal, Innovation Director, Cru High School Ministry. The Google assets live in his Drive folder "Cru HS 60th Anniversary Site". Broader project planning happens in Claude chat (which has the Google Drive connectors); this repo is for site code iteration.
