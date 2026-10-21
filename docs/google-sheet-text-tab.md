# Study Abroad Promotional Materials Google Sheet content contract

The promotional-materials frontends read live content from the published **Study Abroad Promotional Materials** spreadsheet. The separate **Website Language** spreadsheet controls the main website and must not be used for presentation copy. Local JSON and embedded values remain offline fallbacks.

Published promotional workbook: https://docs.google.com/spreadsheets/d/e/2PACX-1vS8qY-gHmx2pseRmx18-8U2ET5Fs8KW8CTeFDP9xV5v3aAF1fWQoRAudwxSaaGXJzm6t8TQ05dbLHOG/pubhtml

## Promotional `Text` tab (gid `1338367530`)

The promotional Text tab uses two columns: `Key` and `Value`. Faculty can edit values. Keys are permanent identifiers used by the promotional-materials code. New keys listed below can be added as new rows without changing source code.

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

The faculty presentation also supports these optional keys in the **same promotional Text tab**. The current slide wording is used until a row is added. See `faculty-presentation-text-rows.tsv` for paste-ready rows.

- `faculty_honorific`, `faculty_eyebrow`, `faculty_heading`, `faculty_default_role`, `faculty_link_label`
- `application_heading`, `application_instruction`, `application_qr_caption`

`credentials_heading` controls the Make the Summer Count title. `website_url` controls both the Apply Now link and its locally generated QR code; `website_display` controls visible link text. Keep those two website fields consistent.

`faculty_honorific` defaults to `Dr.` for every promotional faculty card. The display code replaces an existing `Prof.`, `Professor`, or `Dr.` prefix from the Faculty tab so editors can change the shared honorific in the Text tab without duplicating it in names.

The current paste-ready version is in `google-sheet-text-tab-paste.tsv`.

## Other tabs

- `Cities` (gid `0`) uses `City`, `Country`, `Category`, and `Featured`. City and country totals are calculated from named rows. The cover labels rows marked Featured. Maps resolve new city names against the local GeoNames gazetteer. Optional `Latitude` and `Longitude` values override geocoding when needed for a place the gazetteer does not recognize.
- `Courses` (gid `753875659`) uses `Code` and `Course`. The course total and Make the Summer Count list are calculated from these rows.
- Promotional `Faculty` (gid `1239199803`) uses `Name`, `Program Title`, and `Link` for the carousel and four-card presentation slide. Portraits remain local assets matched to the known profile links. This is distinct from Website Language's Faculty tab.
- `Institutions` (gid `1659852286`) uses `Institution`, `City`, and `Country` for the carousel. Featured-site photographs remain local assets matched by institution name; new rows need a corresponding local photo before they can appear in the carousel.

The local city lookup is derived from GeoNames' `cities5000` data, filtered to European country codes. Map pages link to the public data sources page for the GeoNames and CC BY 4.0 attribution. Regenerate the lookup with `python3 scripts/build_city_geocoder.py`; see `data/GEONAMES-ATTRIBUTION.md` for coverage and source details.

If the published spreadsheet cannot be reached, the flyer uses its checked-in local content so the preview and PDF export still render.
