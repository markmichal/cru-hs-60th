/* =====================================================================
   CREATE CORRECTIONS FORM — run once
   ---------------------------------------------------------------------
   Builds a public "Help us get the history right" Google Form, links it
   to a new "Corrections" tab in this spreadsheet, and sets up a
   Pending/Done status dropdown (Pending = red, Done = green) so your
   team can see at a glance what still needs handling.

   HOW TO RUN:
   1. Open the Sheet -> Extensions -> Apps Script.
   2. In the left "Files" list, click + -> Script, name it "corrections",
      and paste this whole file in. Save.
   3. Pick createCorrectionsForm in the function dropdown, click Run.
      (Approve permissions if asked - same as before.)
   4. Open View -> Logs (or the Execution log). Copy the PUBLIC FORM LINK
      and send it to your assistant to wire the website button to it.
   5. The new form drops into your My Drive root - drag it into the
      "Cru HS 60th Anniversary Site" folder to keep things tidy.
===================================================================== */

function createCorrectionsForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const form = FormApp.create("Help us get the history right");
  form.setDescription(
    "Spotted a wrong date, a misspelled name, or a photo in the wrong place? " +
    "You knew these moments firsthand - help us correct the record. " +
    "Tell us what's off and what it should say, and our team will review every suggestion."
  );
  form.setCollectEmail(false);

  form.addParagraphTextItem()
    .setTitle("What needs fixing?")
    .setHelpText("Which person, photo, or event? Describe it so we can find it - e.g. \"Dan Whitmore's Denver years\" or \"the 1991 beach photo\".")
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle("What should it say instead?")
    .setHelpText("The correction - e.g. \"He was in Denver 1983-1992, not 1985.\"")
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle("How do you know?")
    .setHelpText("Optional, but it helps us weigh suggestions - e.g. \"I was on staff with him\" or \"I'm his daughter.\"");

  form.addTextItem().setTitle("Your name").setRequired(true);
  form.addTextItem().setTitle("Your email")
    .setHelpText("Only used if we need to follow up - never shown publicly.")
    .setRequired(true);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();

  // Find the freshly created response tab (newest "Form Responses" sheet)
  const sheets = ss.getSheets().filter(function (s) {
    return s.getName().indexOf("Form Responses") === 0;
  });
  const tab = sheets[sheets.length - 1];
  tab.setName("Corrections");

  // Add a Status column with a Pending/Done dropdown, colored.
  const statusCol = tab.getLastColumn() + 1;
  tab.getRange(1, statusCol).setValue("Status");
  const numRows = Math.max(tab.getMaxRows() - 1, 1);
  const statusRange = tab.getRange(2, statusCol, numRows, 1);

  statusRange.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(["Pending", "Done"], true)
    .setAllowInvalid(true).build());

  tab.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Pending")
      .setBackground("#EA4335").setFontColor("#FFFFFF").setBold(true)
      .setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Done")
      .setBackground("#34A853").setFontColor("#FFFFFF").setBold(true)
      .setRanges([statusRange]).build()
  ]);

  Logger.log("Corrections tab ready with Pending/Done status.");
  Logger.log("PUBLIC FORM LINK (send this to wire the website button):");
  Logger.log(form.getPublishedUrl());
  Logger.log("Edit the form here:");
  Logger.log(form.getEditUrl());
}

/* Auto-set new correction submissions to "Pending" so they show up red.
   This installable trigger fires on every form submit. To enable it:
   run installCorrectionsTrigger ONCE (separate from createCorrectionsForm). */
function installCorrectionsTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Avoid duplicate triggers
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "onCorrectionSubmit") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("onCorrectionSubmit").forSpreadsheet(ss).onFormSubmit().create();
  Logger.log("Trigger installed: new corrections will auto-mark Pending.");
}

function onCorrectionSubmit(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tab = ss.getSheetByName("Corrections");
  if (!tab || !e || !e.range) return;
  // Only act on edits to the Corrections sheet
  if (e.range.getSheet().getName() !== "Corrections") return;
  const headers = tab.getRange(1, 1, 1, tab.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h).toLowerCase().trim(); });
  const statusCol = headers.indexOf("status") + 1;
  if (statusCol < 1) return;
  const row = e.range.getRow();
  if (tab.getRange(row, statusCol).getValue() === "") {
    tab.getRange(row, statusCol).setValue("Pending");
  }
}
function fixCorrectionsStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tab = ss.getSheetByName("Corrections");
  if (!tab) { Logger.log("No tab named 'Corrections' found - check the exact tab name."); return; }

  // Find or create a Status column
  const lastCol = tab.getLastColumn();
  const headers = tab.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return String(h).toLowerCase().trim(); });
  let statusCol = headers.indexOf("status") + 1;
  if (statusCol < 1) {
    statusCol = lastCol + 1;
    tab.getRange(1, statusCol).setValue("Status");
  }

  const numRows = Math.max(tab.getMaxRows() - 1, 1);
  const range = tab.getRange(2, statusCol, numRows, 1);

  range.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(["Pending", "Done"], true)
    .setAllowInvalid(true).build());

  tab.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Pending")
      .setBackground("#EA4335").setFontColor("#FFFFFF").setBold(true)
      .setRanges([range]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Done")
      .setBackground("#34A853").setFontColor("#FFFFFF").setBold(true)
      .setRanges([range]).build()
  ]);

  // Mark any existing filled-in rows that have no status yet as Pending
  const values = range.getValues();
  let changed = false;
  for (let i = 0; i < values.length; i++) {
    if (tab.getRange(i + 2, 1).getValue() !== "" && values[i][0] === "") {
      values[i][0] = "Pending"; changed = true;
    }
  }
  if (changed) range.setValues(values);

  Logger.log("Done. Corrections now has a Pending/Done Status column (red/green).");
}