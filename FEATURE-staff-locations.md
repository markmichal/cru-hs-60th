# Feature spec: Staff Service & Locations
*Paste this into Claude Code as your kickoff message for the feature, or commit it to the repo as FEATURE-staff-locations.md and tell Claude Code to read it. Read CLAUDE.md first for project architecture.*

## Goal
Represent staff members and the locations they served across six decades of ministry. People are the center: each person has a journey through cities over time, and locations get their own pages built from those journeys. The dataset will always be incomplete and continually growing — every view must render gracefully from partial data.

## Phase 1 — Data + views

**Data source.** A new tab in the existing Google Sheet (same SHEET_ID as CONFIG) named `Staff Service`. One row per stint: `Person Name | Location | Start Year | End Year | Role | Notes | Approved | Submitted By | Submitted At`. The last two columns are internal provenance — who entered the row and when — and must NEVER be displayed on the website (the site already ignores unrecognized columns; keep it that way). Read it via the same gviz pattern as the other tabs (by tab name, case-insensitive substring header matching, tolerate the tab not existing yet). Only rows with Approved = TRUE and a non-empty Person Name count. All other fields optional: missing End Year may mean "still serving" or "unknown" — display the span as e.g. "1992–1995", "1992–", or no years at all.

**Aggregation.**
- By person: all stints with the same Person Name (exact match after trim), sorted by Start Year (missing years sort last). This is the person's journey.
- By location: all stints with the same Location, grouped into eras (reuse the existing eraOf()/CONFIG.ERAS logic — decades by default).

**Person profiles (extend the existing People view).** A person may exist in the Staff Service tab, in the People column of content items, or both — merge them. Profile shows: (1) their service journey as an ordered path of location + years chips, (2) the existing grid of items they're tagged in. People with only stints and no tagged photos still get profiles.

**New Locations view.** Add a fourth nav tab "Locations" (make its label editable via the data-set/Site Settings system like the other nav labels). Index: a grid of location cards — location name, overall year span, count of people who served there, count of gallery items with a matching Location value. Clicking opens a location page: staff roster grouped by era (clicking a person goes to their profile) plus a grid of content items whose Location matches. Match locations by exact string after trimming; do NOT try fuzzy matching ("Orlando" vs "Orlando, FL" are different strings — reviewers normalize data, not code).

**Constraints.**
- Single-file architecture stays: all of this goes in index.html.
- Do not break anything in CONFIG or the existing tabs/views/editor.
- Follow the existing visual language (Cru brand rules in CLAUDE.md): turquoise for people, white cards, Sora headings.
- Update CLAUDE.md if you change any architectural fact.

## Phase 2 — AI intake page (primary deliverable; build right after Phase 1 in the same effort)

This is the main way staff-service data will be entered. Trusted "information gatherers" (non-technical; do not assume any AI familiarity) paste freeform notes from conversations (e.g. "Talked to Dan Whitmore — started Tulsa around '78, moved to Denver in 83 with his wife Susan (she joined staff in 85), they were there till about 92") and the page turns them into Staff Service rows.

- Separate intake.html in the repo (own URL, e.g. /cru-hs-60th/intake.html), gated by its OWN PIN (CONFIG.INTAKE_PIN — deliberately different from the editor PIN so gatherers don't get page-editing power; the Apps Script checks whichever PIN matches the action requested).
- Flow: paste notes → POST to the existing Apps Script web app (CONFIG.SCRIPT_URL) with action "parseNotes" → the script calls an LLM API and returns structured stints as JSON → page renders an editable preview table (every cell correctable, rows deletable/addable) → "Add to spreadsheet" POSTs action "addStints" → script appends rows to Staff Service with Approved = FALSE. Show a clear "submitted for review — a reviewer approves before anything appears publicly" confirmation.
- LLM provider: default to Gemini via the Google AI Studio REST API (free tier covers this volume); structure the script so the provider lives in one small function that could be swapped for Anthropic later. API key is read from Script Properties (e.g. GEMINI_API_KEY) — NEVER in client code or the repo. Include a SETUP comment in the script telling the owner exactly where to paste the key (Apps Script → Project Settings → Script Properties).
- The parser prompt lives in the Apps Script and follows staff-notes-parser-prompt.md: one row per stint, never invent years, blanks + Notes over guesses, spouses get their own rows. Have the LLM return strict JSON (array of {personName, location, startYear, endYear, role, notes}).
- Guardrails in the script: reject notes over ~8,000 characters; cap one parse call per request; return friendly error messages the page can display.
- UX for non-technical users: a required "Your name" field (the gatherer's own name, remembered for the session), one big textarea with a short instruction line ("Paste your notes about a person and where they served"), one Parse button with a loading state, the preview table, one submit button. No jargon.
- On addStints, the script writes the gatherer's name into Submitted By on every row of the batch and stamps Submitted At with the current date/time server-side (never trust the client for the timestamp).
- Apps Script changes (two new doPost actions + provider function + setup comments) are delivered as reference code in the repo; the owner pastes them into the Sheet's script editor and redeploys (Manage deployments → new version).
- Everything lands unapproved; the existing review workflow is the publication gate.

## Acceptance checks
1. Site loads with zero Staff Service rows (tab missing or empty) without errors — all existing views unchanged.
2. Add 3 approved stints for one person across two cities → person appears in People with a journey; both cities appear in Locations.
3. A location referenced only by a photo (no stints) still appears in Locations with its items.
4. A stint with no years renders without "undefined" or "NaN" anywhere.
