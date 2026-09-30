# Planned changes to the CollectiveAccess profile

**Status:** proposed, not applied. Written 2026-09-30.
**Profile:** `Juwon-s-Vault/raw/historic-fashion-archive/uva_fashion.xml` ("[Standard] Costume Core Collection Profile").

These changes prepare CollectiveAccess (CA) for the 3D museum version of the site: flagship garments shown on the runway, with the rest of the collection imported from CA. Line numbers refer to the profile as of the date above and will drift as the file changes. Element and list codes don't drift.

## Before you start: the XML only affects new installs

CA reads the profile once, when it installs a new instance. Editing the XML does nothing to a CA system that's already running. For each change below:

1. Make it in the live CA admin screens (metadata elements, lists and vocabularies, user interfaces).
2. Make the same change in the XML, so a future reinstall matches.

## What already works

- Every field the frontend reads exists under the name it expects: `date_range`, `condition`, `storage_location`, `gender`, `age_group`, `color_location`, `material_location`, `function`, `description`, `provenance`, `web_narrative` and `web_display_settings`. All of them are on an editor screen.
- The fields for flagship pieces already exist, so no new fields are needed:
  - `web_display_settings.featured_on_runway` (yes/no)
  - `web_display_settings.homepage_order` (number)
  - `object_3d_documentation.model_file_reference` (the 3D file)

## Changes to make

### 1. Fix broken apostrophes

Four labels contain `â` where `’` should be. The file was saved with the wrong text encoding at some point.

| Line | Where | Currently |
|------|-------|-----------|
| 530–531 | `object_types` → `mens_womens` | "Menâs and Womenâs Suit(s)" |
| 1053 | `garment_subtype_list` → `mens_womens` | "Menâs and Womenâs Suit(s)" |
| 2779 | `web_story` description | "garmentâs public detail page" |

**Why:** the first one is a garment type, and the website displays type names. It would appear on the public site as written.

**How:** replace each `â` with `’` (or a plain `'`). In the live system, edit the list item label (and the `web_story` field description).

### 2. Remove defaults from descriptive lists

These lists have an item marked as the default:

| Line | List | Default | Used by field |
|------|------|---------|---------------|
| 19 | `color_types` | black | `color` |
| 60 | `material_types` | cotton | `material` |
| 97 | `technique_types` | hand_sewing | `technique` |
| 141 | `silhouette_types` | aline | `silhouette` |
| 167 | `neckline_types` | jewel | `neckline` |
| 191 | `sleeve_types` | long | `sleeve_length`, `sleeves` |
| 210 | `waist_types` | natural | `waist` |
| 223 | `skirt_types` | aline | `skirt` |
| 244 | `hem_types` | floor | `hem` |
| 259 | `closure_types` | buttons | `closure_type` |
| 277 | `closure_placement_types` | center_front | `closure_placement` |
| 294 | `gender_types` | female | `gender` |
| 312 | `age_types` | adult | `age_group` |
| 326 | `function_types` | day | `function` |
| 349 | `socioeconomic_types` | middle | `socioeconomic_class` |
| 367 | `condition_types` | good | `condition`, `condition_term` |
| 120 | `garment_types` | dress | (no field uses this list) |

**Why:** CA pre-fills a list's default in the editor. As far as I know it saves that value unless someone changes it. Records nobody finished describing would then look complete, e.g. every garment female, adult, in good condition, black and cotton. The website's filters and related-garment matching treat those values as real.

**How:** set `default="1"` to `default="0"` on each item above. In the live system, untick "default" on the same list items.

**Keep these defaults**, since they describe workflow state rather than the garment: `digitization_progress_types → not_started`, `metadata_review_status_types → draft`, `object_types → garment`, `entity_types → ind`, `measurement_units → in`, and the `storage_location_types` defaults.

**Check existing records:** if CA has been in use with these defaults on, some saved values may be defaults nobody chose. Those can't be told apart automatically. Only a curator review can catch them.

### 3. Make the 3D file field a URL

`object_3d_documentation.model_file_reference` (line 2533) is a Text field described as "Filename or URL". The website can only load a full link, not a bare filename.

**How:** change its type from `Text` to `Url` so CA validates entries. Update the description to say it must be the full public link to the GLB file.

**Caveats:**

- CA may not let you change the type of a field that already holds values. If so, add a new URL field to the container and move the values over.
- The server hosting the GLB files must allow the website to fetch them (CORS).
- The website's security headers must also allow that server. That's a frontend change, listed below.

### 4. Let type-specific fields reach child types

Three fields only appear for certain garment types:

| Field | Types it's limited to |
|-------|-----------------------|
| `neckline` | `dr`, `sh`, `jkt`, `otw`, `st`, `end` |
| `sleeve_length` | `dr`, `sh`, `jkt`, `otw`, `st`, `end` |
| `garment_subtype` | `jkt`, `st`, `otw`, `oc`, `tr`, `sh`, `acs`, `hw`, `sho`, `jwl`, `tex`, `und` |

`object_types` is a hierarchy: Shirt → Blouse, Outerwear → Overcoat, Jacket → Suit Jacket, and so on. None of the restrictions say to include child types (the profile never uses `includeSubtypes`). As I understand CA, a restriction then applies to that exact type only. A garment catalogued as a Blouse, Overcoat or Suit Jacket gets no neckline or sleeve length field.

**How:** add `<includeSubtypes>1</includeSubtypes>` to each of these restrictions. In the live system, tick the equivalent "include subtypes" option on each field's type restrictions. Test on one child type first to confirm the fields appear.

### 5. Add a field saying which 3D file is which

`object_3d_documentation` allows up to 5 entries per garment, which is right: free orbit and zoom works best with a light file that loads fast plus a detailed one loaded on close inspection. But nothing says which entry is which.

**How:** add a list field `model_role` to the container, with items `web_preview`, `full_detail` and `archival_master`. The site loads `web_preview` in the hall, swaps in `full_detail` when you zoom in, and never loads the archival master.

## Decisions still needed

### 6. One "is this public" flag, not two

The profile has two ways to mark a record public:

- CA's built-in `access` field (Administrative screen, line ~3157)
- The custom `web_display_settings.public_display` (line 2728)

The website only checks `public_display`. A curator who sets `access` alone won't see any change on the site.

**Options:**

- **Use `access`.** It's CA's standard, and CA's own tools respect it. The frontend's filter would switch to it.
- **Use `public_display`.** The frontend already supports it. Curators must know to ignore `access`, or `access` could be removed from the editor screen.

### 7. What makes a garment a "flagship"

Proposed rule: a garment goes on the runway when **`featured_on_runway` = yes and `model_file_reference` is filled in**. A flagged record with no file stays off the runway. `digitization_status.three_d_status` stays a tracking field and doesn't affect the site.

`homepage_order` would set the order along the runway within an era. Now that the homepage *is* the runway, its label ("Homepage Order") could be renamed "Runway Order".

### 8. One way to record what kind of garment it is

There are two:

- **The object type hierarchy:** Suit → "Men's and Women's Suit", Jacket → Suit Jacket.
- **The separate `garment_subtype` field**, whose list repeats some of the same values (`mens_womens` is in both).

The website only reads the object type. A suit typed as Suit, with its subtype recorded in `garment_subtype`, shows on the site as just "Suit". The same suit typed directly as the child type shows the full name. The site's type grouping and related-garment matching work from that label, so the two methods give inconsistent results.

**Recommendation:** use the type hierarchy, which is what the site already reads, and retire `garment_subtype`. The alternative is flat types plus the subtype field, which means changing the frontend to read it.

### 9. One accession number, not two

Records have CA's built-in identifier (`idno`) and a separate `accession_number` field, both on the Basic screen. The website uses `idno` everywhere: as the accession number shown to visitors, in page URLs, and to infer a year when a garment has no date.

**Recommendation:** treat `idno` as the accession number and remove `accession_number` from the editor screen, so the two can't disagree.

### 10. Use or drop `web_slug`

`web_display_settings.web_slug` exists, but the website builds page URLs from `idno` and ignores it. Either the frontend reads `web_slug` when it's filled in, or the field is removed so curators don't fill in something with no effect.

### 11. Dates decide where a garment stands in the museum

Each wing is an era, so a garment's date decides which wing it's in and where it stands on the runway. `date_range` is optional (`minAttributesPerRow` 0). When it's missing, the site guesses a year from the `idno`, e.g. `DR.1965.001`, and if that fails the garment has no wing.

**Recommendation:** don't make the field required, since that would block cataloguing unknown pieces. Instead, make "has a date" a rule before a record is marked public.

Also consider simplifying the field later. `date_range` is a container holding two date-range fields (`earliest_date`, `latest_date`), but a single CA date-range field already accepts "1920–1925", "circa 1920" or "1920s". Two range fields invite entries like an earliest date of "1920–1930". Moving existing data to one field is real work, though, so this can wait.

## Security

### 12. Give the website its own read-only CA account

The website logs into CA with `CA_USERNAME` / `CA_PASSWORD`. If that's an administrator account, anyone who gets the site's server environment variables can also edit or delete the collection. The profile defines no roles.

**How:** create a role in CA that can only read objects, their representations and the fields above. Create a dedicated user with that role, and put its credentials in the site's environment variables. This is done in CA's admin screens; the profile can also define roles for future installs.

## Minor

These fields are defined but not on any editor screen, so curators can't fill them in. Add them to a screen if they're meant to be used:

- `references`
- `public_information`
- `private_information`
- `internal_notes`

## To verify on the live install

`public_display` and `featured_on_runway` are yes/no lists. It's unknown whether CA's API returns their value as the item code (`yes`) or as an internal item number. The frontend's public filter (`isPublic()` in `lib/collectiveAccess.ts`) accepts `yes`, `1` and `true`. If CA returns item numbers, the filter hides every garment.

The app logs a warning when the filter hides everything, so the first real sync will show which case applies. The same question applies to the other list fields (colors, materials, gender and so on), which the frontend also expects as text.

## Frontend changes that go with this

Not part of the profile. Listed so the two sides stay in step.

Done on the `museum-revamp` branch:

- `ca_objects.object_3d_documentation` is fetched per garment (`DETAIL_BUNDLES` in `lib/collectiveAccess.ts`). `featured_on_runway` and `homepage_order` are read into `featuredOnRunway` and `runwayOrder`.
- `model_role` is read (change 5), and `lib/museum.ts` uses it to pick the preview and detail files. Entries without a role still work. Bare filenames in `model_file_reference` are ignored, since the site can't load them (change 3).
- Images are filled in after hydration, in the background, and saved to the disk cache.

Still to do:

- Allow the 3D model server in the Content-Security-Policy (`middleware.ts`), once it's known where the GLB files will live.
- If decision 6 picks `access`, switch `isPublic()` to it.
- If decision 10 keeps `web_slug`, use it for page URLs when it's filled in.

## Not reviewed

The profile builds on CA's `base` profile (`base="base"` in its header). Standard system lists, such as representation types and access statuses, come from there. They aren't in this file, so they weren't reviewed.
