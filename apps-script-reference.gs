/****************************************************************************
 * Cru High School 60th — Google Sheet Web App (REFERENCE COPY)
 * ==========================================================================
 * This is the COMPLETE script that runs inside the Google Sheet (it is NOT
 * run from the GitHub repo — this file is only a reference/backup). It powers:
 *   1. saveSettings      — the website's hidden page editor (PIN 6060)
 *   2. parseNotes        — staff intake "Parse my notes"     (PIN 1951, AI)
 *   3. addStints         — staff intake "Add to spreadsheet" (PIN 1951)
 *   4. parseHistory      — history intake "Parse my notes"   (PIN 1951, AI)
 *   5. addHistoryEvents  — history intake "Add to spreadsheet"(PIN 1951)
 *   6. photo renaming    — auto-names uploaded photos by Title/Year/People
 *                          (form-submit trigger + "Cru 60th" menu; see the
 *                          PHOTO RENAMING section near the bottom for setup)
 *   7. PUBLIC share.html  — the public, photo-first story page (NO PIN):
 *        parseServiceText    — alumni "Map my journey" (AI)
 *        addServiceFromPublic— append their stints to Staff Service
 *        uploadStoryMedia    — save an uploaded photo/video to Drive
 *        parseStoryText      — alumni "Share this story" (AI)
 *        addStoryFromPublic  — insert the story at the top of the Stories tab,
 *                              and auto-rename the uploaded file (Stage 2)
 *        vimeoThumb          — server-side Vimeo oEmbed → thumbnail URL (so the
 *                              share page can preview unlisted Vimeo videos too)
 *
 * --------------------------------------------------------------------------
 * PASTE-AND-REDEPLOY (every time you change this file):
 *   1. Google Sheet → Extensions → Apps Script. Select all, delete, paste this
 *      whole file, click Save.
 *   2. Deploy → Manage deployments → pencil (edit) the Web app → Version:
 *      "New version" → Deploy. The web app URL stays the SAME.
 *   The site (index.html, intake.html, history-intake.html, share.html) all use
 *   that one URL — no other change needed.
 *
 *   >>> CHANGED 2026-06-27 — added the `vimeoThumb` action: a server-side Vimeo
 *       oEmbed proxy. Two uses: (a) share.html shows thumbnails for UNLISTED/
 *       PRIVATE Vimeo videos, and (b) the index.html story pop-out checks each
 *       Vimeo video's `embeddable` flag so it can show a clean "Watch this
 *       video" card instead of Vimeo's black "privacy settings" error box when
 *       embedding is disabled. (The browser can't reach oEmbed itself, and
 *       Vimeo's public API reports neither thumbnails for private videos nor
 *       embeddability.) REQUIRES a NEW web-app version to go live; until then
 *       the site degrades gracefully (share.html falls back to the public-only
 *       thumbnail path; the pop-out shows the button card for Vimeo). No new
 *       Script Properties needed.
 *
 *   >>> CHANGED 2026-06-25 — added convertStoryTypeToPhoto(): a one-time MANUAL
 *       cleanup that changes every "Story"-typed row on the Stories tab to
 *       "Photo" (the site retired the "Story" gallery filter). Run it ONCE from
 *       the Apps Script editor (pick the function → Run) or from the Sheet's
 *       "Cru 60th" menu → "Convert Story type → Photo". This is editor/menu-only
 *       and does NOT require a web-app redeploy by itself — just paste this file
 *       in and run it. (Pasting also brings in the 2026-06-24 Stage 2 change
 *       below; redeploy a new version if that auto-rename isn't live yet.)
 *
 *   >>> CHANGED 2026-06-24 — paste this file in and redeploy a NEW version for
 *       this to take effect:
 *         • STAGE 2 — PUBLIC UPLOAD AUTO-RENAMING: a photo or video uploaded on
 *           share.html is now auto-renamed at submission time to the same clean
 *           "Year — Title — People.ext" name the Google-Form path already uses.
 *           It happens inside addStoryFromPublic (after the row is written, so it
 *           can never lose a submission) and only touches files in your own "Story
 *           Uploads" Drive folder — pasted YouTube/Drive links that aren't ours
 *           are left alone. No new trigger or permission beyond the Drive access
 *           you already approved for "Story Uploads". This is the only change in
 *           this version; if you already pasted/redeployed the 2026-06-23 version,
 *           this redeploy just adds the auto-rename.
 *
 *   >>> CHANGED 2026-06-23 — you MUST paste this file in and redeploy a NEW
 *       version for these to take effect:
 *         • STRUCTURAL PASS:
 *           - The story/gallery tab is now called "Stories" (was "Form
 *             Responses 2"). RENAME the actual Sheet tab to "Stories" by hand so
 *             the code and the Sheet match. (index.html was updated to read it.)
 *           - Every intake/append handler now writes BY HEADER NAME, never by
 *             column position — so you can reorder columns (e.g. move Approved /
 *             On Timeline / Featured to the far left) without breaking writes.
 *           - New submissions are INSERTED AT THE TOP (row 2), newest first, on
 *             Stories, Staff Service, and the master timeline.
 *           - Approved (and On Timeline / Featured where present) is written as
 *             the literal word "FALSE" on every new row, so your red conditional
 *             formatting flags it for review.
 *         • addStoryFromPublic stores the submitter's EMAIL (Email column) and a
 *           SERVER-SIDE timestamp, maps NAME -> the "Your name" column and the
 *           time -> the "Timestamp" column; it no longer writes "Submitted By" /
 *           "Submitted At" on the Stories tab (those duplicated the form's own
 *           columns). You may delete those two columns from Stories once a test
 *           submission lands in Your name + Timestamp. (Staff Service keeps its
 *           Submitted By/At — that tab is intentional provenance; leave it.)
 *         • (share.html requires name + email before a story can be sent.)
 *
 * --------------------------------------------------------------------------
 * SETUP — do this once (≈5 minutes). Plain-language steps:
 *
 * A) GET AN ANTHROPIC (CLAUDE) API KEY
 *    1. Go to https://platform.claude.com  → sign in → "API keys" →
 *       "Create Key". Copy the key it gives you (starts with "sk-ant-").
 *       Note: Claude's API is pay-as-you-go. Parsing a note costs a fraction
 *       of a cent; add a small amount of credit at console billing if asked.
 *
 * B) PASTE THIS SCRIPT IN
 *    2. In the Google Sheet: Extensions → Apps Script.
 *    3. Select everything in the editor and delete it, then paste THIS whole
 *       file in. Click the Save icon.
 *
 * C) STORE THE KEY SAFELY (never put it in the website or this file)
 *    4. In the Apps Script editor: click the gear "Project Settings" (left side).
 *    5. Scroll to "Script Properties" → "Add script property".
 *    6. Property name:  ANTHROPIC_API_KEY
 *       Value:          (paste the key from step 1)
 *       Click "Save script properties".
 *       (If you set this up before, the key is already here — leave it.)
 *
 * D) RE-DEPLOY SO THE WEBSITE USES THE NEW VERSION
 *    7. Top-right: Deploy → Manage deployments → click the pencil (edit) on the
 *       existing Web app deployment → Version: "New version" → Deploy.
 *    8. Keep the SAME web app URL (it stays the same after redeploy). That URL
 *       is already in index.html, intake.html, and history-intake.html.
 *    9. If asked, set "Who has access: Anyone".
 *
 * Test the staff intake from /intake.html and the history intake from
 * /history-intake.html by pasting a note and clicking "Parse my notes".
 *
 * E) (OPTIONAL) TURN ON AUTOMATIC PHOTO RENAMING
 *    See the "PHOTO RENAMING" section near the bottom of this file for the
 *    one-time steps: add an "On form submit" trigger and approve the new
 *    Google Drive permission. Skip this if you don't want photo renaming.
 *
 * F) PUBLIC STORY PAGE (share.html) — the "Story Uploads" Drive folder
 *    The first time someone uploads a photo on share.html, this script creates
 *    a Drive folder called "Story Uploads" (in the script owner's My Drive) and
 *    sets each uploaded file to "Anyone with the link → Viewer" so the website
 *    can display it. No setup is strictly required, BUT it is wise to:
 *      1. Run uploadStoryMedia once (just submit a test photo on share.html), then
 *      2. Open Drive → find the new "Story Uploads" folder → right-click → Share →
 *         set the FOLDER itself to "Anyone with the link → Viewer" too.
 *    The first upload will trigger a Google Drive permission prompt — approve it.
 *    NOTE: share.html is PUBLIC (no PIN). These actions skip the PIN check; they
 *    cap text + file size as light abuse guards. Every submission is Approved=FALSE.
 * --------------------------------------------------------------------------
 * NOTE ON PINS: these must match the website CONFIG.
 *   EDIT_PIN   6060  (index.html CONFIG.EDIT_PIN)            — page editor
 *   INTAKE_PIN 1951  (intake.html / history-intake.html)    — both intakes
 ****************************************************************************/

const EDIT_PIN     = "6060";
const INTAKE_PIN   = "1951";
const SETTINGS_TAB = "Site Settings";
const STAFF_TAB    = "Staff Service";
const MASTER_TAB   = "Cru HS 60th Anniversary Timeline (master)";
const FORM_TAB     = "Stories";   // story/gallery rows (the website reads this tab).
                                  // Renamed from "Form Responses 2" — rename the
                                  // actual Sheet tab to "Stories" to match.

// Header row written when the Staff Service tab is first created. Order matters:
// the last two columns are internal provenance and are never shown on the site.
const STAFF_HEADERS = ["Person Name","Location","Start Year","End Year","Role","Notes","Approved","Submitted By","Submitted At"];

// Timeline event types the history intake may assign (the site styles these).
const EVENT_TYPES = ["Milestone","Photo","Flyer","Video","Story","Event"];

// PUBLIC share.html settings.
const STORY_FOLDER_NAME = "Story Uploads";  // Drive folder for public uploads
const PUBLIC_TEXT_CAP   = 6000;             // friendly cap on pasted/spoken text
const PUBLIC_FILE_BYTES = 25 * 1024 * 1024; // ~25 MB hard guard on an upload

/* ============================ ROUTER ============================ */
function doPost(e){
  try{
    const body = JSON.parse(e.postData.contents);
    switch(body.action){
      case "saveSettings":     return handleSaveSettings(body);
      case "parseNotes":       return handleParseNotes(body);
      case "addStints":        return handleAddStints(body);
      case "parseHistory":     return handleParseHistory(body);
      case "addHistoryEvents": return handleAddHistoryEvents(body);
      // ---- PUBLIC share.html actions (no PIN) ----
      case "parseServiceText":    return handleParseServiceText(body);
      case "addServiceFromPublic":return handleAddServiceFromPublic(body);
      case "uploadStoryMedia":    return handleUploadStoryMedia(body);
      case "parseStoryText":      return handleParseStoryText(body);
      case "addStoryFromPublic":  return handleAddStoryFromPublic(body);
      case "vimeoThumb":          return handleVimeoThumb(body);
      default:                 return json({ ok:false, error:"Unknown action." });
    }
  }catch(err){
    return json({ ok:false, error:String(err && err.message || err) });
  }
}

// Simple GET so you can open the web app URL in a browser to confirm it's live.
function doGet(){
  return json({ ok:true, service:"cru-hs-60th",
    actions:["saveSettings","parseNotes","addStints","parseHistory","addHistoryEvents",
             "parseServiceText","addServiceFromPublic","uploadStoryMedia","parseStoryText","addStoryFromPublic","vimeoThumb"] });
}

function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ===================== 1) SAVE SETTINGS (page editor) ===================== */
function handleSaveSettings(body){
  if(body.pin !== EDIT_PIN) return json({ ok:false, error:"Wrong PIN." });
  const settings = body.settings || {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SETTINGS_TAB);
  if(!sheet){
    sheet = ss.insertSheet(SETTINGS_TAB);
    sheet.appendRow(["Key","Value"]);
  }
  // Read existing keys → row index, so we update in place instead of duplicating.
  const values = sheet.getDataRange().getValues();
  const rowOf = {};
  for(let r = 1; r < values.length; r++){ rowOf[String(values[r][0]).trim()] = r + 1; }
  Object.keys(settings).forEach(key => {
    const val = settings[key];
    if(rowOf[key]) sheet.getRange(rowOf[key], 2).setValue(val);
    else { sheet.appendRow([key, val]); rowOf[key] = sheet.getLastRow(); }
  });
  return json({ ok:true });
}

/* ===================== 2) PARSE NOTES — STAFF (AI) ===================== */
function handleParseNotes(body){
  if(body.pin !== INTAKE_PIN) return json({ ok:false, error:"Wrong PIN." });
  const notes = String(body.notes || "").trim();
  if(!notes) return json({ ok:false, error:"No notes provided." });
  if(notes.length > 8000) return json({ ok:false, error:"Notes too long (keep under ~8,000 characters)." });
  try{
    return json({ ok:true, stints: callLlmParse(notes) });   // one parse call per request
  }catch(err){
    return json({ ok:false, error:String(err && err.message || err) });
  }
}

/* ===================== 3) ADD STINTS — STAFF (append rows) ===================== */
function handleAddStints(body){
  if(body.pin !== INTAKE_PIN) return json({ ok:false, error:"Wrong PIN." });
  const stints = Array.isArray(body.stints) ? body.stints : [];
  if(!stints.length) return json({ ok:false, error:"No rows to add." });
  const submittedBy = String(body.submittedBy || "").trim();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(STAFF_TAB);
  if(!sheet){
    sheet = ss.insertSheet(STAFF_TAB);
    sheet.appendRow(STAFF_HEADERS);
  }

  // Match columns by header name (never by position) so the owner can reorder.
  const M = colMapper_(sheet);
  var cPerson   = M.ensureCol("person",       "Person Name");
  var cLoc      = M.ensureCol("location",     "Location");
  var cStart    = M.ensureCol("start",        "Start Year");
  var cEnd      = M.ensureCol("end",          "End Year");
  var cRole     = M.ensureCol("role",         "Role");
  var cNotes    = M.ensureCol("notes",        "Notes");
  var cApproved = M.ensureCol("approved",     "Approved");
  var cSubBy    = M.ensureCol("submitted by", "Submitted By");
  var cSubAt    = M.ensureCol("submitted at", "Submitted At");
  var width = M.headers.length;

  const now = new Date();                 // server-side timestamp — never trust the client
  var rows = [];
  stints.forEach(function(s){
    var name = String(s.personName || "").trim();
    if(!name) return;                     // a row must have a person name
    var row = []; for(var i = 0; i < width; i++) row.push("");
    function put(ci, v){ if(ci >= 0 && ci < width) row[ci] = v; }
    put(cPerson,   name);
    put(cLoc,      String(s.location || "").trim());
    put(cStart,    s.startYear || "");
    put(cEnd,      s.endYear   || "");
    put(cRole,     String(s.role  || "").trim());
    put(cNotes,    String(s.notes || "").trim());
    put(cApproved, "FALSE");               // reviewer turns this on
    put(cSubBy,    submittedBy);
    put(cSubAt,    now);
    rows.push(row);
  });
  if(!rows.length) return json({ ok:false, error:"No valid rows (each needs a person name)." });

  var startRow = insertTopRows_(sheet, rows.length);   // newest first, just under the header
  sheet.getRange(startRow, 1, rows.length, width).setValues(rows);
  return json({ ok:true, added: rows.length, startRow: startRow });
}

/* ===================== 4) PARSE HISTORY — TIMELINE (AI) ===================== */
function handleParseHistory(body){
  if(body.pin !== INTAKE_PIN) return json({ ok:false, error:"Wrong PIN." });
  const notes = String(body.notes || "").trim();
  if(!notes) return json({ ok:false, error:"No notes provided." });
  if(notes.length > 8000) return json({ ok:false, error:"Notes too long (keep under ~8,000 characters)." });
  try{
    return json({ ok:true, events: callLlmHistory(notes) });  // one parse call per request
  }catch(err){
    return json({ ok:false, error:String(err && err.message || err) });
  }
}

/* ===================== 5) ADD HISTORY EVENTS — TIMELINE (insert rows at top) =====================
 * Inserts one row per event at the TOP of the master timeline tab (just under
 * the header, newest first), matching whatever columns already exist there by
 * case-insensitive substring on the header (never by position). Approved is
 * forced to the literal "FALSE"; Submitted By / Submitted At are written as
 * internal provenance (the site ignores unrecognized columns). If the master
 * tab is missing the Approved / Submitted By / Submitted At columns, they are
 * created at the end so nothing is lost.
 */
function handleAddHistoryEvents(body){
  if(body.pin !== INTAKE_PIN) return json({ ok:false, error:"Wrong PIN." });
  const events = Array.isArray(body.events) ? body.events : [];
  if(!events.length) return json({ ok:false, error:"No events to add." });
  const submittedBy = String(body.submittedBy || "").trim();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_TAB);
  if(!sheet) return json({ ok:false, error:"Could not find the timeline tab \"" + MASTER_TAB + "\"." });

  // Match columns by header name (never by position). Title/Year/etc. are used
  // only if they already exist; Approved/Submitted By/At are created if missing.
  const M = colMapper_(sheet);
  var cTitle    = M.colOf("title");
  var cYear     = M.colOf("year");
  var cLocation = M.colOf("location");
  var cPeople   = M.colOf("people");
  var cType     = M.colOf("type");
  var cStory    = M.colOf("story");
  var cTimeline = M.colOf("timeline");              // "On Timeline"
  var cFeatured = M.colOf("featured");              // optional
  var cApproved = M.ensureCol("approved",     "Approved");
  var cSubBy    = M.ensureCol("submitted by", "Submitted By");
  var cSubAt    = M.ensureCol("submitted at", "Submitted At");

  var now = new Date();
  var width = M.headers.length;
  var rows = [];
  events.forEach(function(e){
    var title = clean(e.title);
    if(!title) return;                              // a row must have a title
    var row = [];
    for(var i = 0; i < width; i++) row.push("");
    function put(ci, v){ if(ci >= 0 && ci < width) row[ci] = v; }
    put(cTitle,    title);
    put(cYear,     yearNum(e.year));
    put(cLocation, clean(e.location));
    put(cPeople,   clean(e.people));
    put(cType,     normType(e.type));
    put(cStory,    clean(e.story));
    put(cTimeline, boolStr_(truthy(e.onTimeline)));
    if(cFeatured >= 0) put(cFeatured, "FALSE");
    put(cApproved, "FALSE");                         // never auto-approve
    put(cSubBy,    submittedBy);
    put(cSubAt,    now);
    rows.push(row);
  });
  if(!rows.length) return json({ ok:false, error:"No valid events (each needs a title)." });

  var startRow = insertTopRows_(sheet, rows.length);  // newest first, just under the header
  sheet.getRange(startRow, 1, rows.length, width).setValues(rows);
  return json({ ok:true, added: rows.length, startRow: startRow });
}

/* ---- Shared write helpers (used by every intake/append handler) ----
 * colMapper_ reads a tab's header row and matches columns by case-insensitive
 * substring on the header text, so writes never depend on physical column
 * position — the owner can reorder columns (e.g. move Approved/On Timeline/
 * Featured to the far left) without breaking anything. ensureCol() creates a
 * missing column at the far right.
 */
function colMapper_(sheet){
  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0]
                  .map(function(h){ return String(h).toLowerCase().trim(); });
  function colOf(sub){ for(var i = 0; i < headers.length; i++){ if(headers[i].indexOf(sub) >= 0) return i; } return -1; }
  function ensureCol(sub, label){
    var i = colOf(sub); if(i >= 0) return i;
    var idx = headers.length;
    if(sheet.getMaxColumns() < idx + 1) sheet.insertColumnsAfter(sheet.getMaxColumns(), (idx + 1) - sheet.getMaxColumns());
    sheet.getRange(1, idx + 1).setValue(label);
    headers.push(String(label).toLowerCase());
    return idx;
  }
  return { headers: headers, colOf: colOf, ensureCol: ensureCol };
}

// We write the literal words TRUE / FALSE (not booleans) so the owner's
// conditional formatting (red Approved=FALSE, etc.) colors the cells.
function boolStr_(v){ return v ? "TRUE" : "FALSE"; }

// Insert `count` blank rows directly below the header (row 1) and return the
// start row (always 2) so the NEWEST submissions appear first. clearFormat()
// stops the new rows from inheriting the header's styling; conditional
// formatting and data validation are sheet/range level and survive it.
function insertTopRows_(sheet, count){
  sheet.insertRowsBefore(2, count);
  sheet.getRange(2, 1, count, sheet.getMaxColumns()).clearFormat();
  return 2;
}

/* =====================================================================
   PUBLIC share.html ACTIONS (no PIN)
   ---------------------------------------------------------------------
   These power the public, photo-first story page. They never require a
   PIN; instead they cap text + file size as light abuse guards, and every
   row they write is Approved=FALSE (a reviewer approves before it shows).
===================================================================== */

/* ---- 7a) parseServiceText: alumni notes -> stints (AI) ---- */
function handleParseServiceText(body){
  const text = String(body.text || body.notes || "").trim();
  if(!text) return json({ ok:false, error:"Please tell us where and when you served." });
  if(text.length > PUBLIC_TEXT_CAP) return json({ ok:false, error:"That's a lot of text — could you shorten it a little?" });
  try{
    const stints = parseJsonArray(anthropicCall(SERVICE_PARSER_PROMPT, text)).map(function(s){
      return { location:clean(s.location), startYear:year(s.startYear), endYear:year(s.endYear), role:clean(s.role) };
    }).filter(function(s){ return s.location || s.startYear || s.endYear || s.role; });
    return json({ ok:true, stints: stints });
  }catch(err){ return json({ ok:false, error: publicErr(err) }); }
}

/* ---- 7b) addServiceFromPublic: append the submitter's stints to Staff Service ---- */
function handleAddServiceFromPublic(body){
  const name = String(body.submittedBy || body.name || "").trim();
  if(!name) return json({ ok:false, error:"Please add your name." });
  const stints = Array.isArray(body.stints) ? body.stints : [];
  if(!stints.length) return json({ ok:false, error:"Add at least one place you served." });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(STAFF_TAB);
  if(!sheet){ sheet = ss.insertSheet(STAFF_TAB); sheet.appendRow(STAFF_HEADERS); }

  // Match columns by header name (never by position).
  const M = colMapper_(sheet);
  var cPerson   = M.ensureCol("person",       "Person Name");
  var cLoc      = M.ensureCol("location",     "Location");
  var cStart    = M.ensureCol("start",        "Start Year");
  var cEnd      = M.ensureCol("end",          "End Year");
  var cRole     = M.ensureCol("role",         "Role");
  var cNotes    = M.ensureCol("notes",        "Notes");
  var cApproved = M.ensureCol("approved",     "Approved");
  var cSubBy    = M.ensureCol("submitted by", "Submitted By");
  var cSubAt    = M.ensureCol("submitted at", "Submitted At");
  var width = M.headers.length;

  const now = new Date();
  var rows = [];
  stints.forEach(function(s){
    var loc = clean(s.location), sy = year(s.startYear), ey = year(s.endYear), role = clean(s.role);
    if(!loc && !sy && !ey && !role) return;     // skip an entirely empty row
    var row = []; for(var i = 0; i < width; i++) row.push("");
    function put(ci, v){ if(ci >= 0 && ci < width) row[ci] = v; }
    put(cPerson,   name);                       // Person Name = the submitter
    put(cLoc, loc); put(cStart, sy); put(cEnd, ey); put(cRole, role);
    put(cNotes,    "");
    put(cApproved, "FALSE");
    put(cSubBy,    name);
    put(cSubAt,    now);
    rows.push(row);
  });
  if(!rows.length) return json({ ok:false, error:"Nothing to save yet." });

  var startRow = insertTopRows_(sheet, rows.length);   // newest first, just under the header
  sheet.getRange(startRow, 1, rows.length, width).setValues(rows);
  return json({ ok:true, added: rows.length, startRow: startRow });
}

/* ---- 7c) uploadStoryMedia: save a base64 file to the "Story Uploads" folder ----
 * Returns a link in the id= form that the site's driveImg()/videoInfo() both
 * understand. The file keeps a temporary name here; addStoryFromPublic renames it
 * to "Year — Title — People.ext" once those fields are known (Stage 2). */
function handleUploadStoryMedia(body){
  try{
    const data = String(body.dataBase64 || "");
    if(!data) return json({ ok:false, error:"No file received." });
    if(Math.floor(data.length * 0.75) > PUBLIC_FILE_BYTES)
      return json({ ok:false, error:"That file is a bit large — please keep it under about 20 MB." });

    const mimeType = String(body.mimeType || "application/octet-stream");
    const filename = String(body.filename || "story-upload")
      .replace(/[\\/:*?"<>|\n\r]+/g, "-").slice(0, 120) || "story-upload";

    const blob   = Utilities.newBlob(Utilities.base64Decode(data), mimeType, filename);
    const folder = getStoryFolder_();
    const file   = folder.createFile(blob);
    try{ file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }catch(e){}

    const id = file.getId();
    return json({
      ok: true,
      fileId: id,
      isVideo: mimeType.indexOf("video") === 0,
      url: "https://drive.google.com/thumbnail?id=" + id + "&sz=w1200"
    });
  }catch(err){ return json({ ok:false, error:String(err && err.message || err) }); }
}

// Get (or make) the dedicated public-upload folder; share it so the site can read it.
function getStoryFolder_(){
  const it = DriveApp.getFoldersByName(STORY_FOLDER_NAME);
  if(it.hasNext()) return it.next();
  const f = DriveApp.createFolder(STORY_FOLDER_NAME);
  try{ f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }catch(e){}
  return f;
}

/* ---- 7d) parseStoryText: a freeform memory -> one structured record (AI) ---- */
function handleParseStoryText(body){
  const story = String(body.story || body.text || "").trim();
  if(!story) return json({ ok:false, error:"Please write a little about your photo or memory." });
  if(story.length > PUBLIC_TEXT_CAP) return json({ ok:false, error:"That's a lot to say — could you trim it just a little?" });
  try{
    const o = parseJsonObject(anthropicCall(STORY_PARSER_PROMPT, story));
    const fields = {
      title:    clean(o.title),
      year:     year(o.year),
      location: clean(o.location),
      people:   clean(o.people),
      type:     normType(o.type),
      story:    clean(o.story) || story         // fall back to their own words
    };
    return json({ ok:true, fields: fields });
  }catch(err){ return json({ ok:false, error: publicErr(err) }); }
}

/* ---- 7e) addStoryFromPublic: insert the story at the TOP of the Stories tab ----
 * Matches existing columns by case-insensitive substring (never by position);
 * creates any it needs at the far right. A photo/flyer link goes in the Photo
 * column; a video link goes in the Video column AND gets a "Watch the video"
 * button so the site embeds a player. Approved / On Timeline / Featured are
 * forced to the literal "FALSE". The row is inserted at row 2 (newest first). */
function handleAddStoryFromPublic(body){
  const name  = String(body.submittedBy || "").trim();
  const s     = body.story || {};
  const title = clean(s.title);
  if(!title) return json({ ok:false, error:"We need a short title for the story." });

  const media    = body.media || null;
  const mediaUrl = media ? clean(media.url) : "";
  const isVideo  = media ? !!media.isVideo : false;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(FORM_TAB);
  if(!sheet){
    sheet = ss.insertSheet(FORM_TAB);
    sheet.appendRow(["Timestamp","Your name","Email","Title","Year","Location","People","Type","Story","Photo",
                     "Video","Button Label","Button URL","Approved","On Timeline","Featured"]);
  }

  // Match columns by header name (never by position) so the owner can reorder.
  const M = colMapper_(sheet);
  var cTitle    = M.ensureCol("title",        "Title");
  var cYear     = M.ensureCol("year",         "Year");
  var cLoc      = M.ensureCol("location",     "Location");
  var cPeople   = M.ensureCol("people",       "People");
  var cType     = M.ensureCol("type",         "Type");
  var cStory    = M.ensureCol("story",        "Story");
  var cPhoto    = M.ensureCol("photo",        "Photo");
  var cApproved = M.ensureCol("approved",     "Approved");
  var cTimeline = M.ensureCol("timeline",     "On Timeline");
  var cFeatured = M.ensureCol("featured",     "Featured");
  // The submitter's NAME goes in the form's existing "Your name" column, and the
  // SERVER-SIDE timestamp goes in the form's existing "Timestamp" column. We no
  // longer write separate "Submitted By"/"Submitted At" columns here — those
  // duplicated the form's own columns. (Staff Service still uses Submitted By/At
  // intentionally as provenance; that tab is untouched.)
  var cName     = M.ensureCol("your name",  "Your name");
  var cEmail    = M.colOf("email");  if(cEmail < 0) cEmail = M.ensureCol("email", "Email");
  var cStamp    = M.ensureCol("timestamp",  "Timestamp");
  var cVideo = -1, cBtnLabel = -1, cBtnUrl = -1;
  if(isVideo && mediaUrl){
    cVideo    = M.ensureCol("video",        "Video");
    cBtnLabel = M.ensureCol("button label", "Button Label");
    cBtnUrl   = M.ensureCol("button url",   "Button URL");
  }

  var width = M.headers.length;
  var row = []; for(var i = 0; i < width; i++) row.push("");
  function put(ci, v){ if(ci >= 0 && ci < width) row[ci] = v; }
  put(cTitle,    title);
  put(cYear,     yearNum(s.year));
  put(cLoc,      clean(s.location));
  put(cPeople,   clean(s.people));
  put(cStory,    clean(s.story));
  put(cApproved, "FALSE");                        // reviewer approves before it shows
  put(cTimeline, "FALSE");
  put(cFeatured, "FALSE");
  var now = new Date();                          // server-side — never trust the client
  put(cName,     name);
  put(cEmail,    clean(body.email));
  put(cStamp,    now);
  if(isVideo && mediaUrl){
    put(cType,     "Video");                  // the site also auto-labels video rows
    put(cVideo,    mediaUrl);
    put(cBtnLabel, "Watch the video");
    put(cBtnUrl,   mediaUrl);
  } else {
    put(cType, normType(s.type));
    if(mediaUrl) put(cPhoto, mediaUrl);
  }

  var startRow = insertTopRows_(sheet, 1);          // newest first, just under the header
  sheet.getRange(startRow, 1, 1, width).setValues([row]);

  // Stage 2: auto-rename the just-uploaded Drive file to match Title/Year/People.
  // After the write so a rename hiccup can never lose the submission. Photo links
  // and uploaded-video links alike live in "Story Uploads"; pasted YouTube/Drive
  // links that aren't ours simply no-op (driveFileIds finds nothing to rename).
  try{ renameStoryUpload_(mediaUrl, s.year, title, s.people); }catch(e){}

  return json({ ok:true, startRow: startRow });
}

/* ---- 7f) vimeoThumb: server-side Vimeo oEmbed → thumbnail URL + embeddability ----
 * The browser can't reach Vimeo's oEmbed (CORS-blocked for fetch, no JSONP),
 * and Vimeo's public v2 API only covers PUBLIC videos. This proxy fetches
 * oEmbed server-side (no CORS there) for ANY Vimeo URL — including unlisted/
 * private links that carry a privacy hash (vimeo.com/ID/HASH).
 * Returns { ok, thumb, embeddable }:
 *   - thumb       the oEmbed thumbnail_url ("" if oEmbed refused the video)
 *   - embeddable  true only when oEmbed returns an <iframe> (i.e. the owner
 *                 permits embedding). When embedding is DISABLED, oEmbed 403s,
 *                 so we report embeddable:false and the site shows its own
 *                 "Watch this video" card instead of Vimeo's error box.
 * Public, no PIN; only accepts vimeo.com URLs. Two callers:
 *   - share.html (input thumbnails): uses `thumb`, falls back to v2 JSONP.
 *   - index.html (story pop-out): uses `embeddable` to decide embed vs card. */
function handleVimeoThumb(body){
  try{
    var url = String(body.url || "").trim();
    if(!/^https?:\/\/(player\.)?vimeo\.com\//i.test(url)) return json({ ok:false, error:"Not a Vimeo URL." });
    // width nudges Vimeo toward a larger thumbnail; muteHttpExceptions so a 403/404
    // (embedding disabled, or a truly private video) returns cleanly, not a throw.
    var api = "https://vimeo.com/api/oembed.json?width=640&url=" + encodeURIComponent(url);
    var resp = UrlFetchApp.fetch(api, { muteHttpExceptions: true });
    if(resp.getResponseCode() !== 200){
      // oEmbed refuses videos whose owner disabled embedding (and private ones).
      return json({ ok:true, embeddable:false, thumb:"" });
    }
    var data = JSON.parse(resp.getContentText());
    var thumb = (data && data.thumbnail_url) || "";
    var embeddable = !!(data && data.html && /<iframe/i.test(data.html));
    return json({ ok:true, embeddable: embeddable, thumb: thumb });
  }catch(err){ return json({ ok:false, error: publicErr(err) }); }
}

// Friendly, public-safe error text (never leak internals to a public visitor).
function publicErr(err){
  var m = String(err && err.message || err);
  if(/api key|ANTHROPIC/i.test(m)) return "Our story helper is taking a quick break. Please try again in a little while.";
  return "Sorry, we couldn't read that just now. Please try again.";
}

// Tolerantly pull a JSON OBJECT out of the model's text (mirrors parseJsonArray).
function parseJsonObject(txt){
  try{ return JSON.parse(txt); }
  catch(e){
    var m = String(txt).match(/\{[\s\S]*\}/);
    if(m){ try{ return JSON.parse(m[0]); }catch(e2){} }
    throw new Error("AI did not return a readable result.");
  }
}

/* ===================== LLM PROVIDER (swappable) =====================
 * Everything provider-specific lives in anthropicCall(). It calls Anthropic's
 * Claude Messages API (raw HTTPS — Apps Script has no SDK). Each parser
 * instructs the model to return a bare JSON array; parseJsonArray() reads it.
 * To swap providers later, replace the body of anthropicCall() only.
 */
function anthropicCall(systemPrompt, notes){
  const key = PropertiesService.getScriptProperties().getProperty("ANTHROPIC_API_KEY");
  if(!key) throw new Error("ANTHROPIC_API_KEY is not set in Script Properties (see SETUP).");

  // Claude Haiku 4.5 — fast and low-cost, plenty for this simple extraction.
  const MODEL = "claude-haiku-4-5-20251001";

  const payload = {
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: "NOTES:\n" + notes }]
  };
  const res = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
    method: "post",
    contentType: "application/json",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  const text = res.getContentText();
  if(code !== 200) throw new Error("AI service error (" + code + "). " + shortErr(text));

  let data;
  try { data = JSON.parse(text); } catch(e){ throw new Error("AI returned an unreadable response."); }
  // Claude returns content as an array of blocks; the JSON lives in the text block.
  const block = (data.content || []).find(function(b){ return b.type === "text" && b.text; });
  if(!block) throw new Error("AI returned no content.");
  return block.text;
}

// Tolerantly pull a JSON array out of the model's text (handles a bare array,
// a {stints|events:[...]} wrapper, or stray markdown fences around it).
function parseJsonArray(txt){
  let parsed;
  try { parsed = JSON.parse(txt); }
  catch(e){
    const m = String(txt).match(/\[[\s\S]*\]/);
    if(!m) throw new Error("AI did not return valid rows.");
    try { parsed = JSON.parse(m[0]); } catch(e2){ throw new Error("AI did not return valid rows."); }
  }
  if(Array.isArray(parsed)) return parsed;
  const arr = (parsed && (parsed.stints || parsed.events)) || [];
  return Array.isArray(arr) ? arr : [];
}

// Staff parser → array of { personName, location, startYear, endYear, role, notes }
function callLlmParse(notes){
  return parseJsonArray(anthropicCall(STAFF_PARSER_PROMPT, notes)).map(function(s){
    return {
      personName: clean(s.personName),
      location:   clean(s.location),
      startYear:  year(s.startYear),
      endYear:    year(s.endYear),
      role:       clean(s.role),
      notes:      clean(s.notes)
    };
  }).filter(function(s){ return s.personName; });
}

// History parser → array of { title, year, location, people, type, story, onTimeline }
function callLlmHistory(notes){
  return parseJsonArray(anthropicCall(HISTORY_PARSER_PROMPT, notes)).map(function(e){
    return {
      title:      clean(e.title),
      year:       year(e.year),
      location:   clean(e.location),
      people:     clean(e.people),
      type:       normType(e.type),
      story:      clean(e.story),
      onTimeline: truthy(e.onTimeline)
    };
  }).filter(function(e){ return e.title; });
}

/* ============================ HELPERS ============================ */
function clean(v){ return String(v == null ? "" : v).trim(); }
function truthy(v){ return v === true || String(v).toUpperCase() === "TRUE"; }
function year(v){
  const m = String(v == null ? "" : v).match(/\b(18|19|20)\d{2}\b/);
  return m ? m[0] : "";
}
function yearNum(v){ const y = year(v); return y ? Number(y) : ""; }
function normType(v){
  const t = clean(v);
  for(var i = 0; i < EVENT_TYPES.length; i++){
    if(EVENT_TYPES[i].toLowerCase() === t.toLowerCase()) return EVENT_TYPES[i];
  }
  return "Event";                                   // safe default for blanks/unknowns
}
function shortErr(t){
  try { const j = JSON.parse(t); return (j.error && j.error.message) ? j.error.message : ""; }
  catch(e){ return ""; }
}

/* ===================== PARSER PROMPTS =====================
 * STAFF mirrors staff-notes-parser-prompt.md (one row per STINT).
 * HISTORY mirrors the spec in FEATURE-staff-locations.md / the history intake.
 * Both must return STRICT JSON arrays — no commentary, no markdown.
 */
const STAFF_PARSER_PROMPT = [
  "You convert messy, conversational notes about Cru High School staff into structured service records.",
  "A 'stint' = one person serving in one location for one time span. Output one row per stint.",
  "",
  "RULES:",
  "- Return ONLY a JSON array. Each item: {personName, location, startYear, endYear, role, notes}.",
  "- One row per person PER location. If a person served in three cities, output three rows.",
  "- A spouse or any other named person gets their OWN separate row(s). Never combine two people in one row.",
  "- NEVER invent or guess years. If a year is not stated, leave it blank (\"\"). 'around 78 / \\'78 / late 70s' -> 1978 only if clearly that exact year; if it's a vague range like 'late 70s', leave the year blank and note it.",
  "- Convert 2-digit years to 4 digits using ministry context (e.g. 78 -> 1978, 92 -> 1992, 05 -> 2005).",
  "- Years are 4-digit strings or \"\". Do not output ranges inside a single year field.",
  "- Prefer BLANKS plus a short 'notes' explanation over guessing. Put uncertainty ('about', 'maybe', 'still there') in notes.",
  "- 'location' is the city/place as stated. Do not normalize or add state/country the speaker didn't say.",
  "- 'role' only if a role/title is stated (e.g. Staff, Director, Intern); otherwise \"\".",
  "- If the notes contain no clear staff record, return [].",
  "- Output JSON only — no commentary, no markdown."
].join("\n");

const HISTORY_PARSER_PROMPT =
  "You are converting freeform notes about Christian ministry history into structured timeline events. " +
  "Return ONLY a JSON array of objects, no commentary, no markdown. Each object must have these exact keys: " +
  "title (required, short descriptive headline), year (4-digit number or null), " +
  "location (city and state/country or null), people (comma-separated names or null), " +
  "type (one of: Milestone, Photo, Flyer, Story, Event), story (narrative description 1-3 sentences), " +
  "onTimeline (true only for major organizational milestones, false otherwise). " +
  "If the notes describe multiple distinct events return multiple objects. " +
  "If nothing clear can be extracted return []. Never invent facts not in the notes.";

/* PUBLIC share.html prompts ------------------------------------------------ */

// SERVICE — a person describing their OWN service. Person is implicit (the
// submitter), so there is no personName field — one row per location.
const SERVICE_PARSER_PROMPT = [
  "You convert a person's own description of where and when they served with Cru High School (Student Venture) into structured service records.",
  "A 'stint' = one location for one time span. Output one row per stint.",
  "",
  "RULES:",
  "- Return ONLY a JSON array. Each item: {location, startYear, endYear, role}.",
  "- One row per location. If they served in three places, output three rows.",
  "- NEVER invent or guess years. If a year is not stated, leave it blank (\"\").",
  "- Convert 2-digit years to 4 digits using ministry context (78 -> 1978, 05 -> 2005).",
  "- Years are 4-digit strings or \"\". Do not output ranges inside a single year field.",
  "- 'location' is the city/place as stated. Do not add a state/country they didn't say.",
  "- 'role' only if a role/title is stated (e.g. Staff, Director, Intern); otherwise \"\".",
  "- If nothing clear can be extracted, return [].",
  "- Output JSON only — no commentary, no markdown."
].join("\n");

// STORY — one freeform memory about a photo/flyer/moment -> ONE record object.
const STORY_PARSER_PROMPT =
  "You help turn a person's freeform memory about a photo, flyer, or moment from Cru High School " +
  "(Student Venture) history into one structured record. " +
  "Return ONLY a JSON object (not an array), no commentary, no markdown, with these exact keys: " +
  "title (a short, warm headline, about 3-8 words), year (a 4-digit number or null), " +
  "location (city and state/country if stated, otherwise null), " +
  "people (comma-separated names they mention, otherwise null), " +
  "type (one of: Photo, Flyer, Story, Event), " +
  "story (a clear 1-3 sentence retelling in a warm, respectful voice, staying true to what they wrote). " +
  "Never invent facts, names, years, or places that are not in their words. If a field is unknown, use null.";

/* =====================================================================
   PHOTO RENAMING  (gives uploaded images meaningful, recognizable names)
   ---------------------------------------------------------------------
   Two pieces, both using the SAME extra Drive permission:
     • onFormSubmitRenamePhoto — fires automatically on each public-form
       submission and renames the just-uploaded photo from the Title /
       Year / People the submitter entered.
     • renameLinkedPhotos      — a "Cru 60th" menu item that scans the
       timeline + form tabs and renames every already-linked photo
       (cleans up the backlog AND Tom's folder photos once linked).

   Renaming is by the file's Drive ID, so the link in the sheet and the
   photo on the website are UNAFFECTED — only the file's name changes.

   EXTRA SETUP for this feature (one time):
     1. After pasting + saving this script, in the Apps Script editor click
        "Triggers" (the alarm-clock icon on the left) → "Add Trigger":
           - Choose function:        onFormSubmitRenamePhoto
           - Event source:           From spreadsheet
           - Event type:             On form submit
        Save. Approve the permissions prompt (it now asks for Google Drive
        access so it can rename files — this is expected and new).
     2. The "Cru 60th → Rename linked photos" menu appears at the top of the
        Sheet after a reload. The first time you run it, approve the same
        Drive permission. Run it once to clean up existing photos.
   Note: the account running the script must have edit access to the photo
   files (true when they live in your own Drive / the form's response folder).
===================================================================== */

// Build a clean, filesystem-safe name like "1972 — First SV Camp — Dave Hughes.jpg".
function buildPhotoName(year, title, people, idx, ext){
  let base = [year, title, people]
    .map(clean).filter(Boolean).join(" — ")
    .replace(/[\\/:*?"<>|\n\r]+/g, "-")
    .replace(/\s+/g, " ").trim()
    .slice(0, 110);
  if(!base) base = "Cru High School photo";
  if(idx > 0) base += " (" + (idx + 1) + ")";   // 2nd+ file in the same submission
  return ext ? base + "." + ext : base;
}

// All Drive file IDs found in a cell value (a form upload column may hold several).
function driveFileIds(v){
  const s = String(v == null ? "" : v);
  const ids = [];
  const re = /(?:\/d\/|[?&]id=)([-\w]{20,})/g;
  let m;
  while((m = re.exec(s)) !== null) ids.push(m[1]);
  if(!ids.length){ const b = s.trim().match(/^[-\w]{20,}$/); if(b) ids.push(b[0]); }
  return ids;
}

// Keep the original extension; fall back to one derived from the MIME type.
function fileExt(file){
  const m = file.getName().match(/\.([A-Za-z0-9]{1,5})$/);
  if(m) return m[1];
  const mime = file.getMimeType() || "";
  if(mime === "image/jpeg") return "jpg";
  if(mime === "image/png")  return "png";
  if(mime === "image/gif")  return "gif";
  if(mime === "image/webp") return "webp";
  if(mime === "application/pdf") return "pdf";
  if(mime === "video/mp4")  return "mp4";
  if(mime === "video/quicktime") return "mov";
  if(mime === "video/webm") return "webm";
  return "";
}

// Rename one file by ID. Returns the new name, or "" if it couldn't (no access etc.).
function renamePhotoFile(id, year, title, people, idx){
  try{
    const file = DriveApp.getFileById(id);
    const name = buildPhotoName(year, title, people, idx, fileExt(file));
    if(file.getName() !== name) file.setName(name);
    return name;
  }catch(err){ return ""; }   // skip quietly — e.g. not found or not editable
}

// Stage 2 — auto-rename a PUBLIC share.html upload at submission time. The file
// was saved to "Story Uploads" with a temporary name by uploadStoryMedia, before
// the title/year/people were known; now that addStoryFromPublic has the parsed
// fields we can give the Drive file the same clean "Year — Title — People.ext"
// name as the form-submit path. driveFileIds() returns [] for YouTube/external
// pasted links, so those are left untouched — only our own Drive files rename.
// Fails quietly (renamePhotoFile swallows its own errors); never blocks the write.
function renameStoryUpload_(mediaUrl, year, title, people){
  driveFileIds(mediaUrl).forEach(function(id, i){
    renamePhotoFile(id, year, title, people, i);
  });
}

// Installable "on form submit" trigger (see EXTRA SETUP above). Renames the
// photo a public submitter just uploaded, using the fields from that response.
function onFormSubmitRenamePhoto(e){
  if(!e || !e.namedValues) return;
  const nv = e.namedValues;
  const get = function(sub){
    for(const k in nv){
      if(k.toLowerCase().indexOf(sub) >= 0){
        const a = nv[k];
        return Array.isArray(a) ? a.join(", ") : String(a || "");
      }
    }
    return "";
  };
  const ids = driveFileIds(get("photo"));   // the "Upload your photo or flyer" column
  ids.forEach(function(id, i){ renamePhotoFile(id, get("year"), get("title"), get("people"), i); });
}

// Adds the reviewer menu when the Sheet opens.
function onOpen(){
  SpreadsheetApp.getUi()
    .createMenu("Cru 60th")
    .addItem("Rename linked photos", "renameLinkedPhotos")
    .addItem("Convert Story type → Photo (one-time)", "convertStoryTypeToPhoto")
    .addToUi();
}

// Scan the timeline + form tabs and rename every linked photo to match its row.
function renameLinkedPhotos(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let total = 0, done = 0;
  [MASTER_TAB, FORM_TAB].forEach(function(tabName){
    const sheet = ss.getSheetByName(tabName);
    if(!sheet || sheet.getLastRow() < 2) return;
    const values  = sheet.getDataRange().getValues();
    const headers = values[0].map(function(h){ return String(h).toLowerCase().trim(); });
    const col = function(sub){ for(var i=0;i<headers.length;i++){ if(headers[i].indexOf(sub)>=0) return i; } return -1; };
    const cPhoto = col("photo"), cT = col("title"), cY = col("year"), cP = col("people");
    if(cPhoto < 0) return;
    for(var r = 1; r < values.length; r++){
      const row = values[r];
      const ids = driveFileIds(row[cPhoto]);
      if(!ids.length) continue;
      const yr = cY>=0?row[cY]:"", ti = cT>=0?row[cT]:"", pe = cP>=0?row[cP]:"";
      if(![yr, ti, pe].some(function(v){ return String(v||"").trim(); })) continue;  // nothing to name it with
      ids.forEach(function(id, i){ total++; if(renamePhotoFile(id, yr, ti, pe, i)) done++; });
    }
  });
  SpreadsheetApp.getUi().alert("Renamed " + done + " of " + total + " linked photo file(s).");
}

// One-time MANUAL cleanup utility (run from the Apps Script editor or the
// "Cru 60th" menu — it is NOT automatic and no trigger calls it). Walks the
// Stories tab and changes every row whose Type is "Story" to "Photo", so the
// retired "Story" type disappears from the site's gallery type filters. Matches
// the Type column BY HEADER NAME (case-insensitive), so column order is irrelevant.
// Safe to re-run: rows already set to anything other than "Story" are left alone.
function convertStoryTypeToPhoto(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(FORM_TAB);
  if(!sheet || sheet.getLastRow() < 2){
    SpreadsheetApp.getUi().alert('No rows found on the "' + FORM_TAB + '" tab.');
    return;
  }
  const values  = sheet.getDataRange().getValues();
  const headers = values[0].map(function(h){ return String(h).toLowerCase().trim(); });
  var cType = -1;
  for(var i = 0; i < headers.length; i++){ if(headers[i].indexOf("type") >= 0){ cType = i; break; } }
  if(cType < 0){
    SpreadsheetApp.getUi().alert('Could not find a "Type" column on the "' + FORM_TAB + '" tab.');
    return;
  }
  var changed = 0;
  for(var r = 1; r < values.length; r++){
    if(String(values[r][cType]).trim().toLowerCase() === "story"){
      sheet.getRange(r + 1, cType + 1).setValue("Photo");
      changed++;
    }
  }
  SpreadsheetApp.getUi().alert('Converted ' + changed + ' "Story" item(s) to "Photo" on the "' + FORM_TAB + '" tab.');
}
