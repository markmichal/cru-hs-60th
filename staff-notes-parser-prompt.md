# Staff-notes parser prompt

This is the canonical prompt the intake feature uses to turn freeform notes into
Staff Service rows. The **live copy runs inside the Apps Script** (the
`PARSER_PROMPT` constant in `apps-script-reference.gs`). Keep the two in sync — if
you change wording here, update the script and redeploy the Web App.

The model must return **strict JSON**: an array of objects, one per *stint*
(one person, one place, one time span):

```json
[ { "personName": "", "location": "", "startYear": "", "endYear": "", "role": "", "notes": "" } ]
```

## Rules

- Return **only** a JSON array — no commentary, no markdown.
- **One row per person per location.** A person who served in three cities → three rows.
- A **spouse or any other named person gets their own row(s).** Never combine two people in one row.
- **Never invent or guess years.** If a year isn't stated, leave it blank (`""`).
  - Convert 2-digit years to 4 digits using ministry context (`78` → `1978`, `92` → `1992`, `05` → `2005`).
  - Vague ranges like "late 70s" → leave the year blank and explain in `notes`.
  - Year fields are 4-digit strings or `""` — never a range inside one field.
- **Prefer blanks + a short `notes` explanation over guessing.** Put uncertainty
  ("about", "maybe", "still there") in `notes`.
- `location` is the place as stated — do not normalize or add state/country the speaker didn't say.
- `role` only if a title is stated (Staff, Director, Intern, …); otherwise `""`.
- If the notes contain no clear staff record, return `[]`.

## Example

**Notes:** "Talked to Dan Whitmore — started Tulsa around '78, moved to Denver in 83
with his wife Susan (she joined staff in 85), they were there till about 92."

**Output:**

```json
[
  { "personName": "Dan Whitmore", "location": "Tulsa",  "startYear": "1978", "endYear": "",     "role": "", "notes": "started around '78" },
  { "personName": "Dan Whitmore", "location": "Denver", "startYear": "1983", "endYear": "1992", "role": "", "notes": "there until about 92" },
  { "personName": "Susan Whitmore", "location": "Denver", "startYear": "1985", "endYear": "1992", "role": "Staff", "notes": "Dan's wife; joined staff in 85" }
]
```
