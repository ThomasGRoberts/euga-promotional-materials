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

- `Cities` uses `City`, `Country`, `Category`, and `Featured`. City and country totals are calculated from named rows. Maps resolve new city names against the local GeoNames gazetteer. Optional `Latitude` and `Longitude` values override geocoding when needed for a place the gazetteer does not recognize.
- `Courses` uses `Code` and `Course`. The course total and lower-right course list are calculated from these rows.
- `Faculty` is read from the master sheet's `Full name`, `Program role`, and `University profile URL` columns for carousel and presentation slides.
- `Institutions` is read from `Institution`, `City`, and `Country`. Featured-site photographs remain local assets matched by institution name; new rows need a corresponding local photo before they can appear in the carousel.

The local city lookup is derived from GeoNames' `cities5000` data, filtered to European country codes. Map pages link to the public data sources page for the GeoNames and CC BY 4.0 attribution. Regenerate the lookup with `python3 scripts/build_city_geocoder.py`; see `data/GEONAMES-ATTRIBUTION.md` for coverage and source details.

If the published spreadsheet cannot be reached, the flyer uses its checked-in local content so the preview and PDF export still render.
