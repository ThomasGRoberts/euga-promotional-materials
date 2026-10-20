# Website Language Google Sheet content contract

The promotional-materials frontends read live content from the published **Website Language** spreadsheet. This spreadsheet is the editable source of truth; local JSON files are offline fallbacks.

## `Promo Text` tab

The `Promo Text` tab uses two columns: `Key` and `Value`. Faculty should edit values only. Keys are permanent identifiers used by the promotional-materials code.

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

- `Cities` uses `City`, `Country`, `Category`, and `Featured`. City and country totals are calculated from named rows. Current-city coordinates are retained in local geographic data. To add a city not already in that data and place it on the maps, add `Latitude` and `Longitude` columns and fill them for the new row.
- `Courses` uses `Code` and `Course`. The course total and lower-right course list are calculated from these rows.
- `Faculty` is read from the master sheet's `Full name`, `Program role`, and `University profile URL` columns for carousel and presentation slides.
- `Institutions` is read from `Institution`, `City`, and `Country`. Featured-site photographs remain local assets matched by institution name; new rows need a corresponding local photo before they can appear in the carousel.

If the published spreadsheet cannot be reached, the flyer uses its checked-in local content so the preview and PDF export still render.
