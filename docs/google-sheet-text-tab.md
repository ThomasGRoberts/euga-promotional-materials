# Google Sheet content contract

The flyer loads live content from the published spreadsheet.

## `Text` tab

The `Text` tab has exactly two columns: `Key` and `Value`. Faculty should edit values only. Keys are permanent identifiers used by the flyer code.

The approved keys are:

- `program_title`
- `program_term`
- `hero_line_1`
- `hero_line_2`
- `intro_sentence_1`
- `intro_sentence_2`
- `credentials_heading`
- `certificate_title`
- `certificate_detail`
- `minor_title`
- `minor_detail`
- `courses_heading`
- `website_display`
- `website_url`

The current paste-ready version is in `google-sheet-text-tab-paste.tsv`.

## Other tabs

- `Cities` uses `City`, `Country`, and `Category`. City and country totals are calculated from these rows. Coordinates for the current cities are retained in the local geographic data.
- `Courses` uses `Code` and `Course`. The course total and lower-right course list are calculated from these rows.

If the published spreadsheet cannot be reached, the flyer uses its checked-in local content so the preview and PDF export still render.
