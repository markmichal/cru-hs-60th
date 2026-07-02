/* =====================================================================
   CREATE COMBINED INTAKE FORM v3 — run once
   ---------------------------------------------------------------------
   Simple, robust two-page layout (no fragile branching):

   PAGE 1 — Service Records: 5 location blocks stacked
     (Location, Start Year, End Year, Role) — fill what applies, rest blank
   PAGE 2 — Photos & Stories: 5 story blocks stacked
     (Title, Year, Location, People, Type, Story) — add what you like

   Identity (name, email) collected first. Everything optional except
   name + email, so people fill only what applies and scroll past the rest.

   Lands in a new response tab. A separate processing script (built via
   Claude Code) splits service blocks into Staff Service rows and story
   blocks into timeline rows.

   HOW TO RUN:
   1. Apps Script editor -> + -> Script -> name it "newform2" -> paste -> Save
   2. Pick createCombinedIntakeForm -> Run -> approve permissions
   3. Open Execution log -> copy PUBLIC FORM LINK and EDIT LINK -> send to assistant
   4. This creates a brand new form; your existing forms are untouched.
===================================================================== */

function createCombinedIntakeForm() {
  const form = FormApp.create("Cru High School 60th — Share Your Story");
  form.setDescription(
    "Sixty years of God working through Cru's high school ministry — and you were part of it. " +
    "First, tell us where and when you served. Then share photos and stories. " +
    "Every submission is reviewed by our team before it appears on the site. " +
    "Don't worry if you can't remember every detail — best guesses are welcome!"
  );
  form.setCollectEmail(false);
  form.setShowLinkToRespondAgain(true);

  // ---- Identity ----
  form.addTextItem().setTitle("Your name").setRequired(true);
  form.addTextItem().setTitle("Your email")
    .setHelpText("Only used if we have questions — never shown publicly.")
    .setRequired(true);

  // ===== PAGE 1: SERVICE RECORDS =====
  form.addPageBreakItem()
    .setTitle("Where & when did you serve?")
    .setHelpText("Fill in as many locations as apply — just leave the rest blank. " +
                 "Served in more than five places? You can submit the form again for the rest.");

  for (let i = 1; i <= 5; i++) {
    form.addSectionHeaderItem().setTitle("Service location " + i +
      (i === 1 ? "" : " (leave blank if not applicable)"));
    form.addTextItem().setTitle("Location " + i)
      .setHelpText(i === 1 ? "City and state, or city and country. Example: Orlando, FL" : "");
    form.addTextItem().setTitle("Start year " + i)
      .setHelpText(i === 1 ? "Best guess is fine. Example: 1995" : "");
    form.addTextItem().setTitle("End year " + i)
      .setHelpText(i === 1 ? "Year you left, or write \"present\" if still serving there." : "");
    form.addTextItem().setTitle("Role " + i)
      .setHelpText(i === 1 ? "Optional. Example: staff, volunteer, intern, city director." : "");
  }

  // ===== PAGE 2: PHOTOS & STORIES =====
  form.addPageBreakItem()
    .setTitle("Photos & Stories")
    .setHelpText("Share as many as you'd like, up to five — just leave the rest blank. " +
                 "Submit again anytime to add more.");

  for (let i = 1; i <= 5; i++) {
    form.addSectionHeaderItem().setTitle("Story " + i +
      (i === 1 ? "" : " (leave blank if not applicable)"));
    form.addTextItem().setTitle("Title " + i)
      .setHelpText(i === 1 ? "A short caption or headline." : "");
    form.addTextItem().setTitle("Year " + i)
      .setHelpText(i === 1 ? "Best guess is fine, even just the decade." : "");
    form.addTextItem().setTitle("Story location " + i)
      .setHelpText(i === 1 ? "City and state, or the venue." : "");
    form.addTextItem().setTitle("People " + i)
      .setHelpText(i === 1 ? "Who's pictured or involved? Separate names with commas." : "");
    form.addMultipleChoiceItem().setTitle("Type " + i)
      .setChoiceValues(["Photo", "Flyer", "Story", "Event"]);
    form.addParagraphTextItem().setTitle("Tell us the story " + i)
      .setHelpText(i === 1 ? "What was happening? Why does this moment matter to you?" : "");
    // File-upload items must be added manually in the form editor
    // (scripts cannot create file-upload questions). Add one per story
    // titled "Upload photo or flyer 1" ... "5" if you want photo uploads.
  }

  // Link to spreadsheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();

  Logger.log("NEW FORM CREATED (two-page, no branching).");
  Logger.log("PUBLIC FORM LINK:");
  Logger.log(form.getPublishedUrl());
  Logger.log("EDIT LINK (add file-upload questions here if wanted):");
  Logger.log(form.getEditUrl());
  Logger.log("A new response tab was added to your spreadsheet.");
}
