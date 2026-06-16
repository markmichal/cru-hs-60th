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
const FORM_TAB     = "Form Responses 2";   // public "Share Your Story" submissions

// Header row written when the Staff Service tab is first created. Order matters:
// the last two columns are internal provenance and are never shown on the site.
const STAFF_HEADERS = ["Person Name","Location","Start Year","End Year","Role","Notes","Approved","Submitted By","Submitted At"];

// Timeline event types the history intake may assign (the site styles these).
const EVENT_TYPES = ["Milestone","Photo","Flyer","Story","Event"];

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
      default:                 return json({ ok:false, error:"Unknown action." });
    }
  }catch(err){
    return json({ ok:false, error:String(err && err.message || err) });
  }
}

// Simple GET so you can open the web app URL in a browser to confirm it's live.
function doGet(){
  return json({ ok:true, service:"cru-hs-60th",
    actions:["saveSettings","parseNotes","addStints","parseHistory","addHistoryEvents"] });
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
  const now = new Date();                 // server-side timestamp — never trust the client
  let added = 0;
  stints.forEach(s => {
    const name = String(s.personName || "").trim();
    if(!name) return;                     // a row must have a person name
    sheet.appendRow([
      name,
      String(s.location || "").trim(),
      s.startYear || "",
      s.endYear   || "",
      String(s.role  || "").trim(),
      String(s.notes || "").trim(),
      false,                              // Approved = FALSE — reviewer turns this on
      submittedBy,
      now
    ]);
    added++;
  });
  return json({ ok:true, added: added });
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

/* ===================== 5) ADD HISTORY EVENTS — TIMELINE (append rows) =====================
 * Appends one row per event to the master timeline tab, matching whatever
 * columns already exist there (by case-insensitive substring on the header).
 * Approved is forced FALSE; Submitted By / Submitted At are written as
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

  // Header row → lowercased labels, matched by substring.
  let headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0]
                  .map(function(h){ return String(h).toLowerCase().trim(); });
  function colOf(sub){ for(var i = 0; i < headers.length; i++){ if(headers[i].indexOf(sub) >= 0) return i; } return -1; }
  // Find a column or create it at the far right if it doesn't exist yet.
  function ensureCol(sub, label){
    var i = colOf(sub);
    if(i >= 0) return i;
    var idx = headers.length;                       // 0-based index of the new column
    if(sheet.getMaxColumns() < idx + 1){
      sheet.insertColumnsAfter(sheet.getMaxColumns(), (idx + 1) - sheet.getMaxColumns());
    }
    sheet.getRange(1, idx + 1).setValue(label);
    headers.push(label.toLowerCase());
    return idx;
  }

  var cTitle    = colOf("title");
  var cYear     = colOf("year");
  var cLocation = colOf("location");
  var cPeople   = colOf("people");
  var cType     = colOf("type");
  var cStory    = colOf("story");
  var cTimeline = colOf("timeline");                // "On Timeline"
  var cApproved = ensureCol("approved",     "Approved");
  var cSubBy    = ensureCol("submitted by", "Submitted By");
  var cSubAt    = ensureCol("submitted at", "Submitted At");

  var now = new Date();
  var width = headers.length;
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
    put(cTimeline, truthy(e.onTimeline));
    put(cApproved, false);                          // never auto-approve
    put(cSubBy,    submittedBy);
    put(cSubAt,    now);
    rows.push(row);
  });
  if(!rows.length) return json({ ok:false, error:"No valid events (each needs a title)." });

  // Append right below the last row that actually has a Title. Do NOT use
  // getLastRow(): the master tab can have many trailing blank-but-formatted
  // rows (checkbox columns, etc.) that inflate it, which would drop new rows
  // ~1000 rows down where they look lost. Scanning the Title column finds the
  // true end of the data.
  var startRow = lastTitleRow(sheet, cTitle) + 1;
  sheet.getRange(startRow, 1, rows.length, width).setValues(rows);
  return json({ ok:true, added: rows.length, startRow: startRow });
}

// Last 1-based row that has a non-empty value in the Title column.
function lastTitleRow(sheet, titleColIdx){
  if(titleColIdx < 0) return sheet.getLastRow();
  var n = sheet.getMaxRows();
  var vals = sheet.getRange(1, titleColIdx + 1, n, 1).getValues();
  for(var r = n - 1; r >= 0; r--){
    if(String(vals[r][0]).trim() !== "") return r + 1;
  }
  return 1;
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
