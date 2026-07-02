# apps-script/ — full mirror of the live Google Apps Script

This folder is a **complete backup** of every file inside the Apps Script
project bound to the Google Sheet (Extensions → Apps Script), pulled down
with `clasp` on 2026-07-02. Before this, only the main file (`Code.js`,
tracked separately as `apps-script-reference.gs` in the repo root) had a
backup — these other 7 files existed ONLY inside Google with no copy
anywhere else:

- `appsscript.json` — project manifest (scopes, timezone, etc.)
- `Dropdowns.js`, `corrections.js`, `Reformat.js`, `checkboxes.js`,
  `newform.js`, `newform2.js`, `newform4.js` — helper/utility scripts
  built up over the project's history (not yet individually documented —
  read each file's own comments for what it does before running it).

`.clasp.json` in this folder points `clasp` at the live script
(scriptId `1LYg1FTvVRMuuWwAntpji9yUlLINpoBnTRTly9i2wpB15ApVeU2z1IgNR`), so
`clasp push` / `clasp pull` run from inside this folder.

**Why this matters:** `clasp push` replaces the ENTIRE file set on the live
script with whatever is in this folder. If this folder is missing any file
that exists live, pushing will DELETE it from Google. Always run
`clasp pull` first to check for drift before pushing, and never delete a
file from this folder unless you mean to delete it from the live script too.

**Relationship to `apps-script-reference.gs`:** that file (repo root) is
the older, hand-maintained copy of just `Code.js` — kept for now since the
rest of the docs (CLAUDE.md, HANDOFF.md) reference it by name. The copy of
`Code.js` in this folder is the same content. Retiring the older file in
favor of this folder is a possible future cleanup, not done yet.
