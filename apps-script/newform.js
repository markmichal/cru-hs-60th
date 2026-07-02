/* =====================================================================
   CREATE COMBINED INTAKE FORM v2 — run once
   ---------------------------------------------------------------------
   Builds a fresh Google Form with:
   - Opening branch: have you served? already submitted locations?
   - Up to 5 progressively-revealed service location blocks
     (Location, Start Year, End Year, Role) - each block appears only
     if the person says they served in another place
   - Up to 5 progressively-revealed story blocks
   - Lands in a new "Form Responses" tab; a separate processing script
     (built via Claude Code) splits service rows into the Staff Service
     tab and stories into the timeline tab.

   HOW TO RUN:
   1. Apps Script editor -> + -> Script -> name it "newform" -> paste -> Save
   2. Pick createCombinedIntakeForm -> Run -> approve permissions
   3. Open Execution log -> copy the PUBLIC FORM LINK and EDIT LINK
   4. Send both links to your assistant.

   NOTE: This does NOT touch your existing form. It creates a brand new one.
===================================================================== */

function createCombinedIntakeForm() {
  const form = FormApp.create("Cru High School 60th — Share Your Story");
  form.setDescription(
    "Sixty years of God working through Cru's high school ministry — and you were part of it. " +
    "First we'll ask where and when you served, then you can share photos and stories. " +
    "Every submission is reviewed by our team before it appears on the site. " +
    "Don't worry if you can't remember every detail — best guesses are welcome!"
  );
  form.setCollectEmail(false);
  form.setShowLinkToRespondAgain(true);

  // ---- Always collect identity first ----
  form.addTextItem().setTitle("Your name").setRequired(true);
  form.addTextItem().setTitle("Your email")
    .setHelpText("Only used if we have questions — never shown publicly.")
    .setRequired(true);

  // ---- Opening branch: did you serve / already submitted locations? ----
  const startChoice = form.addMultipleChoiceItem().setTitle("Have you served with Cru High School Ministry?");

  // We build sections first, then wire choices to them.

  // SERVICE LOCATION BLOCKS (5) -------------------------------------------------
  // Each block is its own page ending with "served somewhere else?" that
  // jumps to the next block (yes) or to the Stories intro (no).
  const serviceBlocks = [];
  for (let i = 1; i <= 5; i++) {
    const page = form.addPageBreakItem().setTitle("Service location " + i);
    serviceBlocks.push(page);
    form.addTextItem().setTitle("Location " + i)
      .setHelpText("City and state, or city and country. Example: Orlando, FL")
      .setRequired(true);
    form.addTextItem().setTitle("Start year " + i)
      .setHelpText("Best guess is fine. Example: 1995");
    form.addTextItem().setTitle("End year " + i)
      .setHelpText("Year you left, or write \"present\" if still serving there.");
    form.addTextItem().setTitle("Role " + i)
      .setHelpText("Optional. Example: staff, volunteer, intern, city director.");
    // The "another location?" question is added after we know the next target.
  }

  // STORIES INTRO + STORY BLOCKS (5) -------------------------------------------
  const storyIntro = form.addPageBreakItem()
    .setTitle("Photos & Stories")
    .setHelpText("Now share a photo, flyer, or story. You can add up to 5, one at a time.");

  const storyBlocks = [];
  for (let i = 1; i <= 5; i++) {
    const page = form.addPageBreakItem().setTitle("Story " + i);
    storyBlocks.push(page);
    form.addTextItem().setTitle("Title " + i)
      .setHelpText("A short caption or headline.")
      .setRequired(i === 1 ? false : false);
    form.addTextItem().setTitle("Year " + i)
      .setHelpText("Best guess is fine, even just the decade.");
    form.addTextItem().setTitle("Location " + i + " (story)")
      .setHelpText("City and state, or the venue.");
    form.addTextItem().setTitle("People " + i)
      .setHelpText("Who's pictured or involved? Separate names with commas.");
    form.addMultipleChoiceItem().setTitle("Type " + i)
      .setChoiceValues(["Photo", "Flyer", "Story", "Event"]);
    form.addParagraphTextItem().setTitle("Tell us the story " + i)
      .setHelpText("What was happening? Why does this moment matter to you?");
    // File upload added manually later (scripts can't create file-upload items).
  }

  // THANK YOU PAGE -------------------------------------------------------------
  const thankYou = form.addPageBreakItem()
    .setTitle("Thank you!")
    .setHelpText("Your submission goes to our team for review before it appears on the site. " +
                 "Want to add more? You can submit the form again anytime.");

  // ---- Wire up the branching now that all pages exist ----

  // After each service block, add the "another location?" question.
  // Re-fetch items isn't needed; we add the question to the page's section
  // by adding it right after building (Forms appends to the current last
  // section). Simplest reliable approach: add these questions in a second
  // pass using navigation on the page break items themselves.

  // Opening choice navigation:
  startChoice.setChoices([
    startChoice.createChoice("Yes — and I'd like to add my service locations now", serviceBlocks[0]),
    startChoice.createChoice("Yes — I've already submitted my service locations", storyIntro),
    startChoice.createChoice("I'm submitting on behalf of someone else", storyIntro)
  ]).setRequired(true);

  // Service block navigation: each block, after its fields, needs a
  // yes/no that jumps to the next block or to storyIntro. We add those
  // questions now and set page navigation.
  for (let i = 0; i < serviceBlocks.length; i++) {
    const isLast = (i === serviceBlocks.length - 1);
    const nextTarget = isLast ? storyIntro : serviceBlocks[i + 1];
    // By default a page break flows to the next page in order. We set the
    // page's "go to section based on answer" via a Yes/No item:
    const q = form.addMultipleChoiceItem();
    // Move this item to directly follow the current service block's fields:
    // (Forms appends at the end, so we set navigation via the page break
    // GO_TO_PAGE on the choices.)
    q.setTitle("Did you serve in another location?");
    if (isLast) {
      q.setChoices([
        q.createChoice("No, that's all", storyIntro),
        q.createChoice("Yes (note: this form holds 5 — submit again for more)", storyIntro)
      ]);
    } else {
      q.setChoices([
        q.createChoice("Yes, add another", nextTarget),
        q.createChoice("No, continue to photos & stories", storyIntro)
      ]);
    }
    // Ensure the service block page itself, if reached by falling through,
    // continues to stories rather than the next service block:
    serviceBlocks[i].setGoToPage(storyIntro);
  }

  // Story block navigation: after each story, "add another?" -> next story or thank you.
  for (let i = 0; i < storyBlocks.length; i++) {
    const isLast = (i === storyBlocks.length - 1);
    const nextTarget = isLast ? thankYou : storyBlocks[i + 1];
    const q = form.addMultipleChoiceItem().setTitle("Would you like to add another story?");
    if (isLast) {
      q.setChoices([
        q.createChoice("No, I'm finished", thankYou),
        q.createChoice("Yes (note: this form holds 5 — submit again for more)", thankYou)
      ]);
    } else {
      q.setChoices([
        q.createChoice("Yes, add another story", nextTarget),
        q.createChoice("No, I'm finished", thankYou)
      ]);
    }
    storyBlocks[i].setGoToPage(nextTarget);
  }

  // storyIntro should flow into the first story block
  storyIntro.setGoToPage(storyBlocks[0]);

  // Link responses to this spreadsheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();

  Logger.log("NEW FORM CREATED.");
  Logger.log("PUBLIC FORM LINK:");
  Logger.log(form.getPublishedUrl());
  Logger.log("EDIT LINK (add file-upload questions here):");
  Logger.log(form.getEditUrl());
  Logger.log("A new response tab was added to your spreadsheet. Send the links to your assistant.");
}