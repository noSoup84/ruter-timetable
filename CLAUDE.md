# CLAUDE.md

A departure board for a hallway tablet, showing real-time Ruter/Entur departures. Static Vue SPA on GitHub Pages, no backend. `SPEC.md` is the source of truth for behaviour. Read it before changing anything the user can see.

## Commands

```sh
npm run dev       # http://localhost:5173/ruter-timetable/  (note the base path)
npm test          # Vitest, runs with TZ=Europe/Oslo
npx vue-tsc -b    # type check
npm run build     # type check + production build to dist/
npm run preview   # serve dist/, needed to test the CSP
```

Run `npx vue-tsc -b` and `npm test` before every commit.

## Layout

- `src/lib/` holds pure logic with no Vue imports, and every file there has a `*.test.ts` next to it. New logic goes here so it can be tested.
  - `entur.ts`: all Entur calls, plus query building and response parsing.
  - `config.ts`: the config type, defaults, validation (`parseConfig`), localStorage, and the export link encoding.
  - `format.ts`, `departures.ts`, `reload.ts`: time formatting, departure filtering, badge colours, and the reload time.
- `src/composables/` holds Vue state. `useConfig` is one shared ref that saves to localStorage on every change. `usePosition` remembers the location answer in memory for the visit only.
- `src/views/` has `BoardView` (`/`), `ConfigView` (`/config`) and `ImportView` (`/import?c=...`). Routing uses hash mode.
- `src/components/` has `DepartureRow`, `AddRows` (the multi-select add form) and `LineBadge`.
- `src/lib/__fixtures__/` holds real Entur responses used by the tests.

## Conventions

- The UI is in Norwegian (default) and English. Never write UI text in a component. Add a key to both languages in `src/lib/i18n.ts` and use `t()` from `useI18n`. Text from Entur is `LocalizedText`, shown with `text()`.
- Code, comments, commit messages and repo docs are English. When a doc quotes UI text, keep the Norwegian and add the English in parentheses.
- Match the surrounding style: small functions, a short doc comment on exported functions, and comments that say why, not what.
- No new runtime dependencies without a clear need. Today there are only `vue` and `vue-router`.
- Dark theme only. The accent is white (`--accent` in `src/style.css`). Don't add blue or other accent colours. Line badge colours come from Entur.
- The config page is used by touch on a tablet. Tap targets must be at least 48 px (the `.form-page` class), and anything that needs touch, like dragging, must use pointer events. Native HTML drag and drop doesn't work on iPad.

## Entur API

- Every request must send `ET-Client-Name`. Its value comes from `VITE_ENTUR_CLIENT_NAME` at build time. Never hardcode it. `.env.local` (git-ignored) sets it for local dev.
- Pass IDs and user input as GraphQL variables or through `URLSearchParams`. Never build them into a query string. Only loop indexes go into the query text.
- The board sends one batched query for all rows every 30 seconds. Keep it batched. The limit is 2000 requests per 2 minutes per client name.
- Verify field names against the live API with curl before using them. The schema has caught us out before, for example `frontText` versus the last stop's name, and `reportType` on situations.

## Things that are easy to break

- **Base path.** `vite.config.ts` reads `BASE_PATH`, and the default is `/ruter-timetable/`. Use paths relative to the base, and test with `npm run build`.
- **CSP.** It is added only in production builds, by the plugin in `vite.config.ts`. A new external host, image, font or inline script must be added to the policy, then checked with `npm run preview`.
- **Config format.** `parseConfig` validates everything, both stored setups and import links. A new field needs a default in `defaultConfig`, a fallback in `parseConfig` so older saved setups still load, and a test. Keep the limits of 50 rows and 200 characters.
- **Workflow permissions.** Only the `deploy` job has `pages: write` and `id-token: write`. Don't move them back to the top level.

## Feedback workflow

The user gives feedback in Norwegian or English. For each item:

1. Update `SPEC.md` if the behaviour changes.
2. `TODO.md` lists only open issues. Add an item there if it can't be done now, and remove it when it is done. Don't keep a history of finished items. Git has that.
3. Commit when the change is done, unless the user asks to test it first.

Check UI changes in a real browser, not only with tests. Headless Chrome through the DevTools protocol works well for screenshots, for example at iPad sizes 1024x768 and 768x1024.

## Git and deploy

- Commit with the identity in the local git config. Don't change it or set another one.
- Leave pushing to the user. Don't change remotes or credential config.
- A push to `main` runs the tests and deploys to GitHub Pages for the repository in `git remote get-url origin`. Check the latest run with `curl https://api.github.com/repos/<owner>/<repo>/actions/runs?per_page=1`.

Personal details for one maintainer's setup, like accounts and URLs, go in `CLAUDE.local.md`, which is git-ignored.
