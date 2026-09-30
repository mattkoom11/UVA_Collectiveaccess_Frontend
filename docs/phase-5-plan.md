# Phase 5 plan: linking the rest of the site into the hall

**Status:** planned, not started. Written 2026-09-30, after phase 4 (the hall became the homepage) on the `museum-revamp` branch.

Phase 5 makes the hall reachable from everywhere else:

- **Timeline** becomes a map of the runway that you can jump into.
- **Collection** cards (and garment records) get a "find it in the hall" link that takes you to that garment's spot.

Both depend on one new feature: a link that opens the hall at a specific place. That comes first.

## 1. Deep links into the hall

### The URL

| URL | Opens |
|-----|-------|
| `/?at=<slug>` | The hall, at that garment. The welcome panel is skipped. |
| `/?wing=<numeral>`, e.g. `/?wing=II` | The hall, at the start of that wing. The welcome panel is skipped. |
| `/` | The entrance with the welcome panel, as now. |

Slugs are already unique and are what garment pages use, so `at` uses them instead of internal IDs. An unknown slug or wing falls back to the normal entrance, with no error.

### What "at a garment" means

- **Flagship:** the visitor starts in the aisle beside it, and the inspection opens straight away: camera flown in, placard showing. "Back to the hall" then leaves them in the aisle, not at the entrance.
- **Lightbox:** the visitor stands in the aisle facing the panel, which is highlighted. The photo overlay does not open automatically, since they came to see where it hangs.

### Building it

- **`lib/hallLayout.ts`:**
  - `findSlot(layout, slug)` returns the flagship or lightbox slot for a garment, or nothing.
  - `viewpointFor(slot)` returns a camera position and facing: for a flagship, its existing aisle position; for a lightbox, the aisle point opposite it, facing the wall.
  - `wingStart(layout, index)` returns the viewpoint at the start of a wing.

  All three are pure functions, tested like the rest of the layout.
- **`MuseumHall`:** takes `start?: { at?: string; wing?: string }`.
  - It resolves the start through the functions above, and passes the position and facing to the Canvas camera, the same way the start pose is passed now.
  - For a flagship it opens the inspection in the `enter` phase. The return point should be that flagship's aisle viewpoint, not the camera's position at load.
- **`app/page.tsx`:** reads `searchParams` and passes them through `MuseumHallLoader`.
- **`isInHall(garment)`**, in `lib/museum.ts`: true when `buildMuseumLayout` places the garment in a wing. Only garments in the hall should show a hall link. Undated garments, and ones with nothing to show, stay out.

### A catch: visitors who can't see the hall

Visitors without WebGL, or with reduced motion on, are redirected to Collection. A hall link shown to them would bounce straight back. The phase 4 capability check (`canShowHall` in `MuseumHallLoader`) should move into a shared hook, `useHallSupported()`. Every hall link then renders only when it returns true.

## 2. Timeline becomes a map of the runway

### What it shows

A top-down plan of the hall, drawn from the same `buildHallLayout` data the hall uses, so the map always matches:

- The four wings as runway segments, sized in proportion to their length in the hall, labeled Wing I–IV with their dates.
- **Flagships** as dots on the runway. Hover or focus shows the garment's name, and clicking opens `/?at=<slug>`.
- **Photo pieces** summarized per wing (e.g. "124 on the walls"), not one mark each: a wing can hold hundreds. Clicking the count opens `/?wing=<numeral>`.
- Clicking a wing's label or segment opens `/?wing=<numeral>`.

### Layout and accessibility

- **Rendering:** it's SVG, with the runway horizontal on desktop and vertical on phones.
- **Keyboard:** every dot, wing and count is a real link (`<a>` inside the SVG, or HTML links positioned over it), so the map works with a keyboard.
- **List below the map:** each wing's garments in date order, each linking to its record plus a hall link. This replaces the current decade cards, and it's also what visitors without the hall use. Their hall links are hidden, as described above.

### Files

- `app/timeline/page.tsx` renders a new `components/timeline/RunwayMap.tsx` and the list.
- `components/garments/TimelineView.tsx` and `TimelineViewDynamic.tsx` are retired once the new list covers what they show. First check that nothing else imports them.

## 3. "Find it in the hall" from Collection and garment records

### Collection cards

`components/garments/GarmentCard.tsx` wraps the whole card in one link to the garment's record. A second link can't go inside it, because HTML doesn't allow a link inside a link. The card needs restructuring:

- The card becomes an `<article>`. The title link covers the card, using a CSS "stretched link" (an `::after` over the whole card), so clicking anywhere still opens the record.
- A separate small link, "In the hall →", sits above that overlay, and only shows when `isInHall(garment)` and the hall is supported.

`GarmentCard` is also used by `TimelineView` and `GarmentSearchClient`, so the change reaches search results too. That's intended.

### Garment records

`GarmentDetailClient` gets a "See it in the hall" link near the title, under the same conditions. For flagships it can say "Inspect in the hall", matching the label on the Label & Card mockup.

## Order of work

1. Deep links: the layout functions and their tests, the `MuseumHall` start prop, and `useHallSupported`.
2. "Find it in the hall" on garment records. It's the smallest use of deep links and checks the whole path end to end.
3. The Collection card restructure.
4. The runway map and list on Timeline, then retire the old timeline components.

## Testing

- **Unit tests:** `findSlot`, `viewpointFor`, `wingStart` and `isInHall`, with the same kind of fixtures as `lib/hallLayout.test.ts`.
- **In the browser:**
  - `/?at=` for a flagship: opens inspecting, and "Back" leaves you beside it.
  - `/?at=` for a lightbox: faces its panel.
  - An unknown slug: the normal entrance.
  - `/?wing=III`.
  - Every map link, the card link and the record link.
  - Hall links hidden when reduced motion is emulated.
  - The map at phone width.

## Open questions

- **The parameter names:** `at` and `wing` are placeholders. Something like `garment` may read better in shared links.
- **Should the address bar update as you move?** Inspecting a garment could update the URL to `?at=<slug>`, so a visitor can copy and share it. It's a small addition, but it means the back button moves between garments inside the hall.
- **Should the map show individual photo pieces?** The plan shows counts. With a small collection, individual marks could work, but they won't scale to hundreds per wing.
- **What happens to the decade grouping?** The current timeline groups by decade inside each era. The new list could keep decade subheadings within each wing.
