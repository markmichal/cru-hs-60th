/* =====================================================================
   CREATE COMBINED INTAKE FORM v4 — run once
   ---------------------------------------------------------------------
   Two-page layout (no branching), with the new story field order and
   media fields.

   PAGE 1 — Service Records: 4 location blocks
     (Location, Start Year, End Year, Role)
   PAGE 2 — Photos & Stories: 4 story blocks, each in this order:
     1. Type (Photo/Flyer/Story/Event)
     2. Video URL
     [ADD MANUALLY: Upload — one file upload for photo/video clip/flyer/file]
     3. Title
     4. Year
     5. Story location
     6. People
     7. Tell us the story

   IMPORTANT: Scripts cannot create file-upload questions. After running,
   open the EDIT link and, inside each Story block, add ONE file-upload
   question right after the "Video URL N" question:
     - "Upload N"  (help: "Upload a photo, short video clip, flyer, or any other file here.")
   The script prints reminders in the log.

   HOW TO RUN:
   1. Apps Script editor -> + -> Script -> name it "newform4" -> paste -> Save
   2. Pick createCombinedIntakeForm -> Run -> approve permissions
   3. Copy PUBLIC FORM LINK and EDIT LINK from the log -> send to assistant
   4. Trash the older test forms + their response tabs to avoid clutter.
===================================================================== */

function createCombinedIntakeForm() {
  const form = FormApp.create("Cru High School 60th — Share Your Story");
  form.setDescription(
    "Sixty years of God working through Cru's high school ministry — and you were part of it. " +
    "First, tell us where and when you served. Then share photos, videos, and stories. " +
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
                 "Served in more than four places? You can submit the form again for the rest.");

  for (let i = 1; i <= 4; i++) {
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
    .setTitle("Photos, Videos & Stories")
    .setHelpText("Share as many as you'd like, up to four — just leave the rest blank. " +
                 "Submit again anytime to add more.");

  for (let i = 1; i <= 4; i++) {
    form.addSectionHeaderItem().setTitle("Story " + i +
      (i === 1 ? "" : " (leave blank if not applicable)"));

    // 1. Type
    form.addMultipleChoiceItem().setTitle("Type " + i)
      .setChoiceValues(["Photo", "Flyer", "Story", "Event"]);

    // 2. Video URL
    form.addTextItem().setTitle("Video URL " + i)
      .setHelpText(i === 1 ? "If you're sharing a video, paste the URL here (YouTube or Google Drive)." : "");

    // [ADD MANUALLY HERE]: "Upload " + i  (one file upload: photo / video clip / flyer / file)

    // 3. Title
    form.addTextItem().setTitle("Title " + i)
      .setHelpText(i === 1 ? "A short caption or headline." : "");

    // 4. Year
    form.addTextItem().setTitle("Year " + i)
      .setHelpText(i === 1 ? "What year did this happen? Best guess is fine, even just the decade." : "");

    // 5. Story location
    form.addTextItem().setTitle("Story location " + i)
      .setHelpText(i === 1 ? "City and state, or the venue." : "");

    // 6. People
    form.addTextItem().setTitle("People " + i)
      .setHelpText(i === 1 ? "Who's pictured or involved? Separate names with commas." : "");

    // 7. Tell us the story
    form.addParagraphTextItem().setTitle("Tell us the story " + i)
      .setHelpText(i === 1 ? "What was happening? Why does this moment matter to you?" : "");
  }

  // Link to spreadsheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();

  Logger.log("NEW FORM CREATED (v4, new story field order with video fields).");
  Logger.log("");
  Logger.log("PUBLIC FORM LINK:");
  Logger.log(form.getPublishedUrl());
  Logger.log("");
  Logger.log("EDIT LINK:");
  Logger.log(form.getEditUrl());
  Logger.log("");
  Logger.log("REMINDER: In the EDIT link, add ONE file-upload question in EACH Story block,");
  Logger.log("right AFTER 'Video URL N', titled 'Upload N':");
  Logger.log("  help text: Upload a photo, short video clip, flyer, or any other file here.");
  Logger.log("Do this for Story 1 through Story 4 (4 upload questions total).");
}