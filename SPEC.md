# Ruter departure board

A minimal web app that shows real-time departures for chosen public transport lines. It runs full screen on a tablet in the hallway, but can be set up for any place in Ruter's area.

The app's interface is in Norwegian by default, and can be switched to English (see Language). UI text quoted in this document is the Norwegian text, with the English in parentheses where it helps.

## Goals

- Show the next departures for a set of lines, stops and directions that the user has chosen.
- Be readable from a distance, with little clutter on screen.
- Run for weeks without attention.
- No backend, no login, no API keys.

## Out of scope

- Journey planning from A to B.
- Walking time to the stop, and filtering out departures you can't make.
- Date, weather, city bikes and anything other than departures and a clock.
- Storing the setup on a server or syncing between devices.

## Platform

- A used, fairly new tablet. Android with Fully Kiosk Browser is recommended, because it keeps the screen on, opens the page on startup and can dim at night. An iPad with Guided Access also works.
- Only modern browsers are supported (the last two versions of Chrome and Safari). No polyfills.
- The layout adapts to portrait and landscape.

## Technology

- Vite, TypeScript and Vue 3.
- Vue Router with two routes: `/` (departure board) and `/config`. Hash mode (`/#/config`), so GitHub Pages needs no 404 redirect.
- Vitest for unit tests.
- Hosted on GitHub Pages in a public repository, deployed from `main` with GitHub Actions. Tests must pass before deploy.
- No other runtime dependencies unless there is a clear need.

## Data source

All data comes from Entur JourneyPlanner v3:

- Endpoint: `POST https://api.entur.io/journey-planner/v3/graphql`
- Required header: `ET-Client-Name: <owner>-ruter-timetable`, in lowercase. The name is set at build time with `VITE_ENTUR_CLIENT_NAME` and is not hardcoded, so forks don't use our name and our quota. GitHub Actions uses the repository variable `ENTUR_CLIENT_NAME` if it exists, otherwise `<repo-owner>-ruter-timetable`. Without the variable, for example locally, `unnamed-ruter-timetable` is used.
- No key. CORS is open (`Access-Control-Allow-Origin: *`), so the app calls the API directly from the browser.
- We don't filter on operator. Trains in the Oslo area are run by Vy and others, not Ruter, and they should be included. This also means the app works in the rest of Norway.

This was verified against the API on 2026-10-06 with line 54 from Kværnerbyen.

### Queries

Stops near a position:

```graphql
{
  nearest(
    latitude: 59.9045
    longitude: 10.7864
    maximumDistance: $distance  # from config, default 250
    filterByPlaceTypes: [stopPlace]
    filterByModes: [bus, tram, metro, rail, water]
  ) {
    edges {
      node {
        distance  # meters
        place { ... on StopPlace { id name transportMode } }
      }
    }
  }
}
```

Searching for a stop by name uses the Entur Geocoder, not GraphQL:

```
GET https://api.entur.io/geocoder/v1/autocomplete?text=kværnerbyen&layers=venue&size=10
```

The response is GeoJSON. `properties.id` is the stop place ID (`NSR:StopPlace:6552`), and `properties.category` gives the type of stop (`onstreetBus`, `metroStation` and so on). The same `ET-Client-Name` header applies.

Lines and directions from a stop. We fetch one departure per line and destination for each platform over the next week:

```graphql
{
  stopPlace(id: "NSR:StopPlace:6552") {
    name
    quays {
      id
      publicCode
      estimatedCalls(
        timeRange: 604800
        numberOfDepartures: 200
        numberOfDeparturesPerLineAndDestinationDisplay: 1
        arrivalDeparture: departures
      ) {
        destinationDisplay { frontText }
        serviceJourney {
          line {
            id
            publicCode
            transportMode
            presentation { colour textColour }  # E60000 / FFFFFF for 54
          }
        }
      }
    }
  }
}
```

A direction is the combination of platform (quay) and line. We use departures instead of journey patterns, because the text on the bus (`frontText`) can differ from the name of the last stop, for example "Sinsen-Grefsen st." versus "Grefsen stasjon". Lines that don't leave from the platform in the next week are not shown.

We don't filter on destination. The same line often has several destinations in the same direction, for example tram 17 to Gaustadalléen and to Jernbanetorget from the same platform, and both should show.

Fetching departures, with one alias per row in the same query. Values are sent as GraphQL variables:

```graphql
query ($q0: String!, $l0: ID!) {
  q0: quay(id: $q0) {
    id
    estimatedCalls(
      numberOfDepartures: 6
      timeRange: 86400
      arrivalDeparture: departures
      includeCancelledTrips: true
      whiteListed: { lines: [$l0] }
    ) {
      aimedDepartureTime
      expectedDepartureTime
      realtime
      cancellation
      destinationDisplay { frontText }
      situations { reportType summary { value language } description { value language } }
    }
  }
  l0: line(id: $l0) {
    id
    presentation { colour textColour }
  }
}
```

We fetch 6 departures and show 3, so a row still has 3 departures when the first ones leave between two fetches.

## Language

- The app has Norwegian (default) and English. All UI text is in `src/lib/i18n.ts`, with Norwegian as the source and an English entry for every key. The type check fails if an English text is missing.
- The language is chosen with two flag buttons (Norway and the United Kingdom) at the top right of the config page, and stored in the config. It also sets the page's `lang` attribute and title.
- Entur has no global language setting, but service alerts and notices (`summary`, `description`) come in both Norwegian and English. The app keeps both and shows the chosen language, falling back to Norwegian.
- Stop names and destinations (`frontText`) are only in Norwegian from Entur, and are shown as they are. Row names are created in the language that is active when the row is added ("54 mot Kjelsås" or "54 to Kjelsås"), and are not translated afterwards.

## Departure board (`/`)

### Layout

- Dark background with light text. No light mode.
- Large clock in the top right corner, in the chosen time format. No date.
- One column of rows, in the order the user has set in config.
- The board fills the whole screen. The font size is the largest that fits both the height (clock and all rows) and the width (badge, name and three times). At least 3 rows are assumed, so a short list doesn't get huge text. The rows share the height that is left.
- A small, faint gear in the top left corner opens `/config`. It sits at the top so it doesn't get in the way of the times on the bottom row.

### A row

- Line badge with the line number, in the line's colour from `presentation.colour` and `presentation.textColour` in the API. For Ruter that is red for city buses, green for regional buses, orange for the metro, blue for trams and purple for boats. Trains have Vy's colours. If the field is missing, a fallback per transport mode is used (see below).
- The row's name, chosen by the user (for example "54 mot Kjelsås").
- Up to 3 upcoming departures.
- If there are active service alerts: a warning icon and the Norwegian `summary` text on one line under the row, cut off with an ellipsis. If there are several, the first is shown. Only alerts with `reportType: incident` are shown, for example "Buss for trikk" (bus replacing tram), diversions and moved stops. Alerts with `reportType: general` are general notices, for example "Buss 54 får økt frekvens" (bus 54 gets more departures), and are not shown under the row. `severity` is "normal" on all of Ruter's alerts (checked 2026-10-06), so it is not used.
- If there are general notices, the line badge gets a small yellow circle with a black "i" in its top left corner. Tapping the line badge opens a speech bubble with a white border, with `summary` and `description` for each notice. Only one bubble is open at a time. The bubble opens below the badge on rows in the top half of the screen, and above the badge on rows in the bottom half, so it is always visible. It closes on another tap on the badge, a tap outside the bubble, or by itself when the screen hasn't been tapped for 10 seconds, so the board isn't left with an open bubble.
- Tapping the times on a row shows all times on that row as clock time (HH:MM) for 5 seconds. Another tap switches back right away.
- If there are no upcoming departures: "Ingen avganger" (no departures) in a faint colour. The row stays, so the layout doesn't jump.

### Time format

Based on `expectedDepartureTime` minus the current time:

| Time to departure | Shown as |
| --- | --- |
| Under 1 minute | `nå` (now) |
| 1 to N minutes | `X m` (rounded down) |
| Over N minutes | Clock time, `14:05` or `2:05 PM` |

N is `minutesLimit` in config, default 30. The time format is `clockFormat` in config: 24-hour (default) or 12-hour. The 12-hour format is in English style (`2:05 PM`) for both languages, since Norwegian has no common 12-hour style. It applies to every clock time on the board.

Departures that have left are removed from the board locally, without waiting for the next fetch.

### Real time, delays and cancellations

- `realtime: false`: the time is shown in a fainter colour, to make clear it is the timetable time.
- Delay over 2 minutes (`expected - aimed > 2 min`): the planned time is shown struck through next to the expected time.
- `cancellation: true`: "Innstilt" (cancelled) in red instead of the time.

### Updates

- Fetches from Entur every 30 seconds, with one combined query for all rows.
- Counts down locally every second between fetches.
- Fetches 24 hours ahead, so the first morning departure shows as a clock time the evening before.

### Errors and lost connection

- On errors the last known data is kept, and the countdown continues locally.
- After 2 minutes without a successful fetch, a small text shows at the bottom: "Sist oppdatert HH:MM" (last updated).
- Retries happen at the normal interval. No full screen error messages.

### Automatic reload

- The page reloads itself once a day. The default time is 04:00, and it can be changed in config. It can also be turned off.
- The purpose is to roll out new versions and to free memory after a long run.

## Config page (`/config`)

The config page shows the saved rows and lets the user add, edit, delete and reorder them.

The config page is made for touch on a tablet: larger text, buttons and checkboxes of at least 48 px, and a fixed top bar with the "← Avganger" (back to departures) button on the left. When a text field gets focus, it scrolls into view above the virtual keyboard, and the search field scrolls all the way to the top so the results have room. Search results are part of the page, not a dropdown, so the keyboard can't cover them. The page has extra space at the bottom, so the last fields can also scroll above the keyboard.

### List of rows

- Each row shows the line badge, name and stop.
- Rename directly in the list. To change line, stop or direction, add a new row and delete the old one.
- Delete a row, with confirmation.
- Reorder by dragging the handle (six dots) on the left of the row. Works with touch and mouse. The page scrolls when dragging near the top or bottom edge.
- Button "Legg til avganger" (add departures).
- At most 50 rows (see Storage), but the layout is made for about 3 to 8.

### Adding departures

Several departures from several stops are added in one go, by ticking them in a list.

1. The first time in a visit, the app asks whether to use your location. If the browser has already given permission, the question is skipped.
2. With location: the app shows the 10 nearest stops within `nearbyDistance` meters (default 250 m), sorted by distance. Under each stop are all lines and directions from it, with checkboxes. Everything is fetched in one query to Entur.
3. Above the list is a search field. A search result is added to the top of the list as a new stop with its directions. Without location the list starts empty, and search is the only way in.
4. Filter buttons for transport mode (bus, metro, tram, train, ferry) apply to the whole list. Only modes that are in the list are shown.
5. Directions that are already added are ticked, greyed out and marked "Lagt til" (added).
6. The "Legg til N avganger" (add N departures) button saves all ticked directions at the bottom of the list. The name is the line number and the first destination ("54 mot Kjelsås stasjon"), and can be changed in the list afterwards.

Example: at home near Kværnerbyen you tick 54 from Kværnerbyen and 70 and 34 in both directions from Kværner, and add all five with one tap.

### Location

- Location is fetched with `navigator.geolocation` only when the user says yes, or the browser has already given permission. The departure board never asks for location.
- The answer to the question and the location itself are remembered for the rest of the visit, so you aren't asked again. Nothing is stored in localStorage, so the suggestions are right when the app is set up somewhere else.
- If the user says no, the browser refuses, or the location doesn't arrive within 10 seconds, the app shows only the search field.
- Geolocation requires HTTPS, which GitHub Pages has. In Fully Kiosk Browser, location access must be turned on in the app's settings.

### Other settings

- Display and search: how many minutes to departure are shown as "X m" before switching to clock time (1 to 120, default 30), and how far away stops count as nearby (50 to 2000 m, default 250). Invalid values are not saved, and the field goes back to the previous value. If the values are missing from a saved setup, the defaults are used.
- Time format: 24-hour (default) or 12-hour.
- Automatic reload: on/off and time. The time field is the browser's own, so it follows the device's settings, not the time format above.
- Button "Last inn siden på nytt" (reload page).
- Button "Tilbakestill alt" (reset everything), with confirmation. It deletes the setup in localStorage, forgets the answer about location and reloads the board. Useful when testing. The location permission the browser has given can't be removed from JavaScript, and must be removed in the browser's settings for the site.

### Export and import

- A button creates a link with the whole setup encoded in the URL (base64url of JSON), for example `https://<user>.github.io/ruter-timetable/#/import?c=...`.
- When the link is opened, the setup is shown with a confirmation before it replaces the existing setup.
- Used to set things up on a PC and move them to the tablet, and as a backup.

## Storage

The setup is stored in `localStorage` under one key, with a version number so the format can change later:

```json
{
  "version": 1,
  "rows": [
    {
      "id": "uuid",
      "name": "54 mot Kjelsås",
      "transportMode": "bus",
      "lineId": "RUT:Line:54",
      "publicCode": "54",
      "quayId": "NSR:Quay:105467",
      "stopName": "Kværnerbyen"
    }
  ],
  "autoReload": { "enabled": true, "time": "04:00" },
  "minutesLimit": 30,
  "nearbyDistance": 250,
  "language": "no",
  "clockFormat": "24h"
}
```

`publicCode` and `stopName` are stored so the config page can show rows without API calls.

An invalid or missing setup gives an empty board with a link to the config page.

The setup can have at most 50 rows, and text fields can be at most 200 characters. A setup that breaks these limits is rejected both on import and when loading from localStorage. The config page doesn't let you add more than 50 rows. The limit stops a crafted import link from making the board send a huge query to Entur every 30 seconds.

## Security

- The production build has a Content Security Policy in a meta tag, because GitHub Pages can't send headers: `default-src 'self'; connect-src https://api.entur.io; style-src 'self' 'unsafe-inline'; img-src 'self' data:`. It is only added at build time, because it would otherwise block Vite's hot reload during development.
- In GitHub Actions only the `deploy` job can publish to Pages. The `build` job, which also runs on pull requests, has read access only.
- See `SECURITY-REVIEW.md` for the review from 2026-10-06.

## Tests

Unit tests with Vitest for:

- The time format (`nå`, `X m`, clock time in 24 and 12 hours, the limits at 1 minute and `minutesLimit`).
- Translations and the choice of language for text from Entur.
- Delays and cancellations.
- Removing departures that have left.
- Reading, validating and migrating the setup from `localStorage`.
- Encoding and decoding the export link.
- Deriving lines and directions from the departures at a stop.

The API is not tested directly. Responses from Entur are stored as fixtures.

## Fallback colours

Used when `presentation.colour` is missing. The values are Ruter's colours as registered with Entur (checked 2026-10-06). Text is white on all of them.

| Transport mode | Colour |
| --- | --- |
| Bus | `#E60000` |
| Tram | `#0B91EF` |
| Metro | `#EC700C` |
| Boat | `#682C88` |
| Train and unknown | `#6B6B6B` |

## Line or stop that no longer exists

If Entur returns `null` for a row's quay or line, the row shows "Finner ikke linjen" (line not found) in a faint colour and a link to the config page. A normal response with no departures still gives "Ingen avganger".
