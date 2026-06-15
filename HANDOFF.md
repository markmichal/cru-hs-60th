# Handoff — Cru HS 60th Anniversary Site

## Status as of 2026-06-15

### Done
- **Phase 1 — Staff Service & Locations view** (`index.html`): Locations nav tab, Staff Service tab loading, People profiles with service journey chips, location detail pages with era-grouped rosters. All acceptance criteria pass in code.
- **Phase 2 — AI intake page** (`intake.html`): PIN-gated (PIN 1951), paste notes → Claude parse → editable preview table → submit to Sheet with Approved=FALSE. Gatherer name remembered per session.
- **Locations map** (`index.html`): Map merged INTO the Locations tab — interactive Leaflet/OpenStreetMap on top, city cards below. Locations auto-geocoded via Nominatim (cached in localStorage); pins and cards both open the location detail page. Ungeocoded places have no pin but still appear as cards. No API key needed.
- **History intake page** (`history-intake.html`): PIN-gated (PIN 1951, same as staff intake). For Tom — paste freeform ministry-history notes → Claude parse → editable preview table (Title, Year, Location, People, Type dropdown, Story, On Timeline checkbox; photos handled separately via a shared Drive folder) → submit appends rows to the master timeline tab with Approved=FALSE.
- **Apps Script** (`apps-script-reference.gs`): Five actions — `saveSettings`, `parseNotes`, `addStints`, `parseHistory`, `addHistoryEvents`. All AI calls use Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) via the Anthropic Messages API. LLM call refactored into one shared `anthropicCall()` helper; `addHistoryEvents` matches master-tab headers by case-insensitive substring and creates Approved/Submitted By/Submitted At columns if missing.

### Still needs (owner action, not code)
1. **Redeploy the Apps Script** (required for the History intake AND for the staff intake to work): paste the updated `apps-script-reference.gs` into the Sheet → Apps Script editor → save → Deploy → Manage deployments → New version. URL stays the same.
2. `ANTHROPIC_API_KEY` must be set in Apps Script → Project Settings → Script Properties (already there if the staff intake was set up).
3. Smoke-test `intake.html` and `history-intake.html` end-to-end with a real note.

### URLs
- Site: https://markmichal.github.io/cru-hs-60th/
- Staff intake: https://markmichal.github.io/cru-hs-60th/intake.html
- History intake: https://markmichal.github.io/cru-hs-60th/history-intake.html

---

## Next feature
None queued.
