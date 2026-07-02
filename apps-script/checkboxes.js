/* =====================================================================
   CONVERT TO CHECKBOXES — run once
   ---------------------------------------------------------------------
   Converts "On Timeline" and "Featured" columns to native Google Sheets
   checkboxes (checked = TRUE, unchecked = FALSE) on:
   - Cru HS 60th Anniversary Timeline (master)
   - Form Responses 2

   Existing TRUE values become checked boxes.
   Existing FALSE or blank values become unchecked boxes.
   The Approved column is left alone (keeps TRUE/FALSE green/red).
===================================================================== */

function convertToCheckboxes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabNames = [
    "Cru HS 60th Anniversary Timeline (master)",
    "Form Responses 2"
  ];
  const columnsToConvert = ["on timeline", "featured"];

  tabNames.forEach(function (tabName) {
    const sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      Logger.log("WARNING: Tab not found: " + tabName);
      return;
    }

    const lastCol = sheet.getLastColumn();
    const lastRow = sheet.getLastRow();
    if (!lastCol || lastRow < 2) {
      Logger.log("Skipping empty tab: " + tabName);
      return;
    }

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    columnsToConvert.forEach(function (keyword) {
      const colIdx = headers.findIndex(function (h) {
        return String(h).toLowerCase().trim().indexOf(keyword) !== -1;
      });
      if (colIdx === -1) {
        Logger.log("  Column not found for: " + keyword + " in " + tabName);
        return;
      }
      const col = colIdx + 1;
      const numDataRows = lastRow - 1;
      const range = sheet.getRange(2, col, numDataRows, 1);

      // Read existing values and convert to booleans
      const vals = range.getValues();
      const boolVals = vals.map(function (row) {
        const v = String(row[0]).toUpperCase().trim();
        return [v === "TRUE"];
      });

      // Remove old dropdown validation
      range.clearDataValidations();

      // Remove old conditional formatting rules that reference this range
      const existingRules = sheet.getConditionalFormatRules();
      const filteredRules = existingRules.filter(function (rule) {
        const ranges = rule.getRanges();
        return !ranges.some(function (r) {
          return r.getColumn() === col;
        });
      });
      sheet.setConditionalFormatRules(filteredRules);

      // Apply checkbox validation
      range.setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireCheckbox()
          .build()
      );

      // Write boolean values so existing data becomes checked/unchecked
      range.setValues(boolVals);

      Logger.log("  Converted to checkboxes: " + keyword + " in " + tabName);
    });

    Logger.log("Done: " + tabName);
  });

  Logger.log("All done. Reload the spreadsheet to see checkboxes.");
}