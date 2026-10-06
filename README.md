# Ruter departure board

Shows real-time departures from Entur on a tablet. See `SPEC.md` for what the app does.

```sh
npm install
npm run dev     # dev server on http://localhost:5173/ruter-timetable/
npm test        # unit tests
npm run build   # builds to dist/
```

A push to `main` runs the tests and deploys to GitHub Pages. The original runs at https://nosoup84.github.io/ruter-timetable/. In the repository, Settings > Pages > Source must be set to "GitHub Actions".

## Entur client name

Entur requires every request to have an `ET-Client-Name` header in the format `<company>-<application>`. The app reads it from `VITE_ENTUR_CLIENT_NAME` at build time.

- GitHub Actions sets it to `<repo-owner>-ruter-timetable`, so a fork gets its own name automatically. To use another name, add the variable `ENTUR_CLIENT_NAME` under Settings > Secrets and variables > Actions > Variables.
- Locally you can put it in `.env.local`, for example `VITE_ENTUR_CLIENT_NAME=yourname-ruter-timetable`. Without it, `unnamed-ruter-timetable` is used.

## GitHub Pages path

GitHub Pages serves the app under `/<repo-name>/`. GitHub Actions sets `BASE_PATH` from the repository name, so a fork with another name also works. With a custom domain, set the variable `BASE_PATH` to `/` under Settings > Secrets and variables > Actions > Variables. Locally, `/ruter-timetable/` is used.
