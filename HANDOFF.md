# Handoff — Cru HS 60th Anniversary Site

## Status as of 2026-06-15

### Done
- **Phase 1 — Staff Service & Locations view** (`index.html`): Locations nav tab, Staff Service tab loading, People profiles with service journey chips, location detail pages with era-grouped rosters. All acceptance criteria pass in code.
- **Phase 2 — AI intake page** (`intake.html`): PIN-gated (PIN 1951), paste notes → Gemini/Claude parse → editable preview table → submit to Sheet with Approved=FALSE. Gatherer name remembered per session.
- **Apps Script** (`apps-script-reference.gs`): All three actions live — `saveSettings`, `parseNotes` (calls Claude Haiku 4.5 via Anthropic API), `addStints`. Fixed this session: removed invalid `thinking` and `output_config` params; model ID corrected to `claude-haiku-4-5-20251001`.

### Still needs (owner action, not code)
1. Paste updated `apps-script-reference.gs` into the Sheet → Apps Script editor → save → Manage deployments → New version.
2. Add `ANTHROPIC_API_KEY` in Apps Script → Project Settings → Script Properties.
3. Smoke-test intake.html end-to-end with a real note.

---

## Next feature — Staff Locations Map

Auto-geocode every location in the Staff Service tab and render an interactive map showing where staff served across six decades. Details TBD — see conversation for spec.
