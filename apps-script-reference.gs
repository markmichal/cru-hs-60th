/****************************************************************************
 * Cru High School 60th — Google Sheet Web App (REFERENCE COPY)
 * ==========================================================================
 * This is the COMPLETE script that runs inside the Google Sheet (it is NOT
 * run from the GitHub repo — this file is only a reference/backup). It powers:
 *   1. saveSettings  — the website's hidden page editor (PIN 6060)
 *   2. parseNotes    — the intake page's "Parse my notes" (PIN 1951, uses AI)
 *   3. addStints     — the intake page's "Add to spreadsheet" (PIN 1951)
 *
 * --------------------------------------------------------------------------
 * SETUP — do this once (≈5 minutes). Plain-language steps:
 *
 * A) GET AN ANTHROPIC (CLAUDE) API KEY
 *    1. Go to https://platform.claude.com  → sign in → "API keys" →
 *       "Create Key". Copy the key it gives you (starts with "sk-ant-").
 *       (This uses Claude instead of Gemini — the new Google "AQ." keys have
 *       no free quota on the Gemini endpoint, so Claude is the reliable path.)
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
 *
 * D) RE-DEPLOY SO THE WEBSITE USES THE NEW VERSION
 *    7. Top-right: Deploy → Manage deployments → click the pencil (edit) on the
 *       existing Web app deployment → Version: "New version" → Deploy.
 *    8. Keep the SAME web app URL (it stays the same after redeploy). That URL
 *       is already in index.html and intake.html as SCRIPT_URL.
 *    9. If asked, set "Who has access: Anyone".
 *
 * That's it. Test from intake.html (the /intake.html page) by pasting a note
 * and clicking "Parse my notes".
 * --------------------------------------------------------------------------
 * NOTE ON PINS: these must match the website CONFIG.
 *   EDIT_PIN   6060  (index.html CONFIG.EDIT_PIN)   — page editor
 *   INTAKE_PIN 1951  (intake.html CONFIG.INTAKE_PIN) — staff intake
 ****************************************************************************/

const EDIT_PIN     = "6060";
const INTAKE_PIN   = "1951";
const SETTINGS_TAB = "Site Settings";
const STAFF_TAB    = "Staff Service";

// Header row written when the Staff Service tab is first created. Order matters:
// the last two columns are internal provenance and are never shown on the site.
const STAFF_HEADERS = ["Person Name","Location","Start Year","End Year","Role","Notes","Approved","Submitted By","Submitted At"];

/* ============================ ROUTER ============================ */
function doPost(e){
  try{
    const body = JSON.parse(e.postData.contents);
    switch(body.action){
      case "saveSettings": return handleSaveSettings(body);
      case "parseNotes":   return handleParseNotes(body);
      case "addStints":    return handleAddStints(body);
      default:             return json({ ok:false, error:"Unknown action." });
    }
  }catch(err){
    return json({ ok:false, error:String(err && err.message || err) });
  }
}

// Simple GET so you can open the web app URL in a browser to confirm it's live.
function doGet(){
  return json({ ok:true, service:"cru-hs-60th", actions:["saveSettings","parseNotes","addStints"] });
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

/* ===================== 2) PARSE NOTES (AI) ===================== */
function handleParseNotes(body){
  if(body.pin !== INTAKE_PIN) return json({ ok:false, error:"Wrong PIN." });
  const notes = String(body.notes || "").trim();
  if(!notes) return json({ ok:false, error:"No notes provided." });
  if(notes.length > 8000) return json({ ok:false, error:"Notes too long (keep under ~8,000 characters)." });

  try{
    const stints = callLlmParse(notes);   // one parse call per request
    return json({ ok:true, stints: stints });
  }catch(err){
    return json({ ok:false, error:String(err && err.message || err) });
  }
}

/* ===================== 3) ADD STINTS (append rows) ===================== */
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

/* ===================== LLM PROVIDER (swappable) =====================
 * Everything provider-specific lives in this one function. This calls
 * Anthropic's Claude Messages API (raw HTTPS — Apps Script has no SDK) and
 * uses structured outputs so the model returns strict JSON we can parse.
 * To swap providers later, replace the body of callLlmParse() only.
 * Returns an array of { personName, location, startYear, endYear, role, notes }.
 */
function callLlmParse(notes){
  const key = PropertiesService.getScriptProperties().getProperty("ANTHROPIC_API_KEY");
  if(!key) throw new Error("ANTHROPIC_API_KEY is not set in Script Properties (see SETUP).");

  // Model: Claude Haiku 4.5 — fast and low-cost, plenty for this simple
  // extraction task. For higher quality you could use "claude-opus-4-8".
  const MODEL = "claude-haiku-4-5";

  const payload = {
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: "disabled" },        // simple extraction — no need to think
    system: PARSER_PROMPT,
    // Structured outputs: force a strict JSON object { stints: [ ... ] }.
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            stints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  personName: { type: "string" },
                  location:   { type: "string" },
                  startYear:  { type: "string" },
                  endYear:    { type: "string" },
                  role:       { type: "string" },
                  notes:      { type: "string" }
                },
                required: ["personName","location","startYear","endYear","role","notes"],
                additionalProperties: false
              }
            }
          },
          required: ["stints"],
          additionalProperties: false
        }
      }
    },
    messages: [{ role: "user", content: "NOTES:\n" + notes }]
  };

  const res = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  const text = res.getContentText();
  if(code !== 200){
    throw new Error("AI service error (" + code + "). " + shortErr(text));
  }
  let data;
  try { data = JSON.parse(text); } catch(e){ throw new Error("AI returned an unreadable response."); }
  // Claude returns content as an array of blocks; the JSON lives in the text block.
  const block = (data.content || []).find(function(b){ return b.type === "text" && b.text; });
  if(!block) throw new Error("AI returned no content.");

  let parsed;
  try { parsed = JSON.parse(block.text); } catch(e){ throw new Error("AI did not return valid rows."); }
  let arr = Array.isArray(parsed) ? parsed : (parsed && parsed.stints) || [];
  if(!Array.isArray(arr)) arr = [];

  // Normalize: years to clean 4-digit numbers (or blank); strings trimmed.
  return arr.map(function(s){
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

function clean(v){ return String(v == null ? "" : v).trim(); }
function year(v){
  const m = String(v == null ? "" : v).match(/\b(18|19|20)\d{2}\b/);
  return m ? m[0] : "";
}
function shortErr(t){
  try { const j = JSON.parse(t); return (j.error && j.error.message) ? j.error.message : ""; }
  catch(e){ return ""; }
}

/* ===================== PARSER PROMPT =====================
 * Mirrors staff-notes-parser-prompt.md. The model must return STRICT JSON
 * (an array), one object per STINT (one person, one place, one time span).
 */
const PARSER_PROMPT = [
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
