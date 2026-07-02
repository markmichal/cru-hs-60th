/* =====================================================================
   REVIEW & TYPE DROPDOWNS (v2) — run once (safe to run again)
   ---------------------------------------------------------------------
   On every tab that has the columns (master timeline + form responses;
   Site Settings is skipped automatically):

   • "Approved" and "On Timeline": TRUE/FALSE dropdowns,
     TRUE = green, FALSE = red, blanks in filled rows set to FALSE.
   • "Type": dropdown with Photo / Flyer / Story / Event / Milestone,
     Milestone cells highlighted light orange. Blanks left blank
     (the website displays a blank type as "Photo").

   HOW TO RUN:
   1. Spreadsheet → Extensions → Apps Script
   2. If you pasted the earlier dropdown script: replace its contents
      with this file. Otherwise: + next to "Files" → Script → paste.
   3. Save, pick setupReviewDropdowns in the function menu, Run.
===================================================================== */

function setupReviewDropdowns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ss.getSheets().forEach(function (sheet) {
    const lastCol = sheet.getLastColumn();
    if (!lastCol) return;

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
      .map(function (h) { return String(h).toLowerCase().trim(); });
    const findCol = function (key) {
      const i = headers.findIndex(function (h) { return h.indexOf(key) !== -1; });
      return i === -1 ? null : i + 1;
    };

    const numRows = Math.max(sheet.getMaxRows() - 1, 1);
    const newRules = [];

    /* ----- Approved + On Timeline: TRUE/FALSE, green/red ----- */
    ["approved", "timeline"].forEach(function (key) {
      const col = findCol(key);
      if (!col) return;
      const range = sheet.getRange(2, col, numRows, 1);

      range.setDataValidation(SpreadsheetApp.newDataValidation()
        .requireValueInList(["TRUE", "FALSE"], true)
        .setAllowInvalid(true).build());

      newRules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo("TRUE")
        .setBackground("#34A853").setFontColor("#FFFFFF").setBold(true)
        .setRanges([range]).build());
      newRules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo("FALSE")
        .setBackground("#EA4335").setFontColor("#FFFFFF").setBold(true)
        .setRanges([range]).build());

      // Blanks in rows that have content become FALSE (clear red state)
      const values = range.getValues();
      let changed = false;
      for (let i = 0; i < values.length; i++) {
        const rowHasContent = sheet.getRange(i + 2, 1).getValue() !== "";
        if (rowHasContent && values[i][0] === "") {
          values[i][0] = "FALSE";
          changed = true;
        }
      }
      if (changed) range.setValues(values);

      Logger.log(sheet.getName() + ": TRUE/FALSE dropdown on \"" +
                 sheet.getRange(1, col).getValue() + "\"");
    });

    /* ----- Type: five-option dropdown, Milestone highlighted ----- */
    const typeCol = findCol("type");
    if (typeCol) {
      const typeRange = sheet.getRange(2, typeCol, numRows, 1);
      typeRange.setDataValidation(SpreadsheetApp.newDataValidation()
        .requireValueInList(["Photo", "Flyer", "Story", "Event", "Milestone"], true)
        .setAllowInvalid(true).build());

      newRules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo("Milestone")
        .setBackground("#FCE5CD").setBold(true)
        .setRanges([typeRange]).build());

      Logger.log(sheet.getName() + ": Type dropdown on \"" +
                 sheet.getRange(1, typeCol).getValue() + "\"");
    }

    // Replaces this sheet's conditional formatting with the rules above.
    // (Fine here — this spreadsheet uses no other color rules.)
    if (newRules.length) sheet.setConditionalFormatRules(newRules);
  });

  Logger.log("Done. Check the Approved, On Timeline, and Type columns.");
}