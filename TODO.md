# Todo and feedback

Feedback and tasks for the app. New items go under "Open". When an item is done, it moves to "Done" with the date and commit.

## Open

- [ ] The line number shows twice on the board, because it is both in the badge and in the suggested name ("54 mot Kjelsås"). Consider dropping the number from the suggested name. (2026-10-06)
- [ ] On the config page all bus badges are red, including regional buses that should be green. The list does not fetch line colours from Entur. (2026-10-06)
- [ ] Test location and nearby stops on a real tablet over HTTPS. (2026-10-06)

## Done

- [x] The location question came up every time a departure was added. It is now asked at most once per visit, and not at all if the browser already has permission. (2026-10-06, 7ddc08d)
- [x] You had to go through the whole flow for each departure. "Legg til avganger" (add departures) now lists all nearby stops and directions with checkboxes, so several departures from several stops are added in one go. (2026-10-06, 7ddc08d)
- [x] The config page needs a button that removes all settings and location sharing and sends you to the board. The browser's own location permission cannot be removed from the app. (2026-10-06, ead35e3)
- [x] The nearby limit for stops should be 250 m, not 1 km. (2026-10-06, 067adf7)
- [x] General notices like "Fra 4. oktober: Buss 54 får økt frekvens" should not show, only service alerts. Now filters on `reportType: incident`. (2026-10-06, 3687428)
- [x] General notices should be readable by tapping a small info button that opens a speech bubble. (2026-10-06, cf00734)
- [x] The board used too little of the screen on iPad. The font now scales to both height and width, and the rows fill the height. (2026-10-06, 510fa54)
- [x] The info button moves to a small white circle with a black "i" in the corner of the line badge, and tapping the badge opens the bubble. This saves horizontal space. (2026-10-06, 6d41525)
- [x] Tapping the times shows them as clock time (HH:MM) for 5 seconds. (2026-10-06, 6d41525)
- [x] The info marker did not look good and should be yellow. It is now an SVG icon, a yellow circle with a black "i". (2026-10-06, ef2b963)
- [x] The info bubble should have a white border. (2026-10-06, 33569b8)
- [x] The info bubble should close by itself after 10 seconds without a tap. (2026-10-06, 0b86eb9)
- [x] The info bubble on the bottom row ended up off screen. Rows in the lower half now open it upwards. (2026-10-06, 0b86eb9)
- [x] The config page should be adapted to tablets and leave room for the virtual keyboard. "Tilbake til avganger" (back to departures) should be a button on the left. (2026-10-06, 4dea93f)
- [x] "min" is written as "m", for example "5 m". (2026-10-06, 4dea93f)
- [x] The arrow buttons for moving departures are replaced with drag and drop. (2026-10-06, 57f41d8)
- [x] The "Last inn siden på nytt" (reload page) button moves to the same line as the auto reload time, to the right of the field. (2026-10-06, 57f41d8)
- [x] The limit for switching from minutes to clock time, and the nearby limit for stops (default 250 m), should be configurable. (2026-10-06, 9691b0a)
- [x] The blue "Legg til avganger" button does not fit the theme. Main buttons, selected rows and checkboxes are now white instead of blue. (2026-10-06, 9691b0a)
- [x] The repository is pushed to noSoup84/ruter-timetable, and the app runs at https://nosoup84.github.io/ruter-timetable/ on GitHub Pages. (2026-10-06, 790f8c2)
- [x] The gear clashed with the times on the bottom row. It is now in the top left corner, and the clock is in the top right. (2026-10-06, 7bb918f)
- [x] The import link is tested on GitHub Pages, in a new tab and in the same tab, and works. (2026-10-06)
- [x] Security review (`SECURITY-REVIEW.md`): limited Pages permissions to the deploy job, a concurrency group per branch, at most 50 rows and 200 characters in the config, and a CSP in the production build. Actions are not pinned to commit SHAs. (2026-10-06, e071e32)
- [x] The site has no favicon. It now has an SVG icon (three line badges in red, blue and orange with white bars on black) and a 180 px PNG icon for "Add to Home Screen" on iPad. (2026-10-06, 9db2b8b)
- [x] The Entur client name should not be hardcoded, since the repository can be forked. It is now set at build time from the repository owner in GitHub Actions. (2026-10-06, d9f826e)
- [x] The GitHub Pages path was hardcoded as `/ruter-timetable/`. It is now set at build time from the repository name, or from the `BASE_PATH` variable. (2026-10-06, 02b725e)
- [x] README.md, SPEC.md and TODO.md should be in English. (2026-10-06, b2979d7)
- [x] Add a CLAUDE.md that helps Claude with further development. (2026-10-06, 11c8c52)
- [x] CLAUDE.md had personal account details that forks would inherit. They are now in a git-ignored CLAUDE.local.md, and CLAUDE.md is generic. (2026-10-06, f1b9caa)
