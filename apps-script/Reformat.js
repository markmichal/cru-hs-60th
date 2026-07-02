/* =====================================================================
   REFORMAT REVIEW COLUMNS — run once
   ---------------------------------------------------------------------
   For each tab:
   - Moves review columns to the far left in the right order
   - Adds green/red (or Pending/Done) conditional formatting
   - Safe to run again if anything changes

   Tab rules:
   - Master timeline + Form Responses 2:
       Approved | On Timeline | Featured | ...rest of columns...
   - Staff Service:
       Approved | ...rest of columns...
   - Corrections:
       Status | ...rest of columns...
===================================================================== */

function reformatReviewColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- Master timeline tab ---
  const masterName = "Cru HS 60th Anniversary Timeline (master)";
  const masterSheet = ss.getSheetByName(masterName);
  if (masterSheet) {
    moveColumnsLeft_(masterSheet, ["approved", "on timeline", "featured"]);
    applyTrueFalseColors_(masterSheet, ["approved", "on timeline", "featured"]);
    Logger.log("Done: " + masterName);
  } else {
    Logger.log("WARNING: Could not find tab: " + masterName);
  }

  // --- Form Responses 2 tab ---
  const formSheet = ss.getSheetByName("Form Responses 2");
  if (formSheet) {
    moveColumnsLeft_(formSheet, ["approved", "on timeline", "featured"]);
    applyTrueFalseColors_(formSheet, ["approved", "on timeline", "featured"]);
    Logger.log("Done: Form Responses 2");
  } else {
    Logger.log("WARNING: Could not find tab: Form Responses 2");
  }

  // --- Staff Service tab ---
  const staffSheet = ss.getSheetByName("Staff Service");
  if (staffSheet) {
    moveColumnsLeft_(staffSheet, ["approved"]);
    applyTrueFalseColors_(staffSheet, ["approved"]);
    Logger.log("Done: Staff Service");
  } else {
    Logger.log("WARNING: Could not find tab: Staff Service");
  }

  // --- Corrections tab ---
  const corrSheet = ss.getSheetByName("Corrections");
  if (corrSheet) {
    moveColumnsLeft_(corrSheet, ["status"]);
    applyPendingDoneColors_(corrSheet, "status");
    Logger.log("Done: Corrections");
  } else {
    Logger.log("WARNING: Could not find tab: Corrections");
  }

  Logger.log("All done. Reload the spreadsheet to see the changes.");
}

/* ============ HELPERS ============ */

/* Moves the named columns to the far left in the given order.
   Matches column headers by case-insensitive substring. */
function moveColumnsLeft_(sheet, keywordsInOrder) {
  const lastCol = sheet.getLastColumn();
  if (!lastCol) return;

  // Work right-to-left so indices don't shift as we move columns
  // We'll move each target column to position 1, 2, 3... in order
  // by iterating the keywords array and moving each to its target position.
  for (let targetPos = keywordsInOrder.length; targetPos >= 1; targetPos--) {
    const keyword = keywordsInOrder[targetPos - 1];
    const currentCol = findCol_(sheet, keyword);
    if (!currentCol) {
      Logger.log("  Column not found for keyword: " + keyword + " in " + sheet.getName());
      continue;
    }
    if (currentCol !== targetPos) {
      sheet.moveColumns(sheet.getRange(1, currentCol), targetPos);
    }
  }
}

/* Finds column index (1-based) by case-insensitive substring match on header row. */
function findCol_(sheet, keyword) {
  const lastCol = sheet.getLastColumn();
  if (!lastCol) return null;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i]).toLowerCase().trim().indexOf(keyword) !== -1) {
      return i + 1;
    }
  }
  return null;
}

/* Adds TRUE=green / FALSE=red conditional formatting and TRUE/FALSE dropdown
   to the named columns (by keyword). Replaces existing rules on that sheet. */
function applyTrueFalseColors_(sheet, keywords) {
  const numRows = Math.max(sheet.getMaxRows() - 1, 1);
  const newRules = [];

  keywords.forEach(function (keyword) {
    const col = findCol_(sheet, keyword);
    if (!col) return;
    const range = sheet.getRange(2, col, numRows, 1);

    // Dropdown
    range.setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(["TRUE", "FALSE"], true)
        .setAllowInvalid(true)
        .build()
    );

    // Green for TRUE
    newRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo("TRUE")
        .setBackground("#34A853").setFontColor("#FFFFFF").setBold(true)
        .setRanges([range]).build()
    );
    // Red for FALSE
    newRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo("FALSE")
        .setBackground("#EA4335").setFontColor("#FFFFFF").setBold(true)
        .setRanges([range]).build()
    );

    // Fill blank cells in rows that have content with FALSE
    const vals = range.getValues();
    let changed = false;
    for (let i = 0; i < vals.length; i++) {
      if (sheet.getRange(i + 2, 1).getValue() !== "" && vals[i][0] === "") {
        vals[i][0] = "FALSE";
        changed = true;
      }
    }
    if (changed) range.setValues(vals);
  });

  if (newRules.length) sheet.setConditionalFormatRules(newRules);
}

/* Adds Pending=red / Done=green formatting to the Status column. */
function applyPendingDoneColors_(sheet, keyword) {
  const col = findCol_(sheet, keyword);
  if (!col) return;
  const numRows = Math.max(sheet.getMaxRows() - 1, 1);
  const range = sheet.getRange(2, col, numRows, 1);

  range.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(["Pending", "Done"], true)
      .setAllowInvalid(true)
      .build()
  );

  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Pending")
      .setBackground("#EA4335").setFontColor("#FFFFFF").setBold(true)
      .setRanges([range]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Done")
      .setBackground("#34A853").setFontColor("#FFFFFF").setBold(true)
      .setRanges([range]).build()
  ]);
}