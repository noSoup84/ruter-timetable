# Ruter avgangstavle

Viser sanntidsavganger fra Entur på et nettbrett. Se `SPEC.md` for hva appen gjør.

```sh
npm install
npm run dev     # utviklingsserver på http://localhost:5173/ruter-timetable/
npm test        # enhetstester
npm run build   # bygger til dist/
```

Push til `main` kjører tester og deployer til GitHub Pages på https://nosoup84.github.io/ruter-timetable/. Under Settings > Pages i repoet må "Source" være satt til "GitHub Actions".

## Entur-klientnavn

Entur krever at alle kall har headeren `ET-Client-Name` i formatet `<firma>-<applikasjon>`. Appen leser den fra `VITE_ENTUR_CLIENT_NAME` ved bygg.

- GitHub Actions setter den til `<repo-eier>-ruter-timetable`. Hvis du forker repoet, får du derfor ditt eget navn automatisk. Vil du ha et annet navn, legg inn variabelen `ENTUR_CLIENT_NAME` under Settings > Secrets and variables > Actions > Variables.
- Lokalt kan du legge den i `.env.local`, for eksempel `VITE_ENTUR_CLIENT_NAME=dittnavn-ruter-timetable`. Uten den brukes `unnamed-ruter-timetable`.

## Sti på GitHub Pages

GitHub Pages viser appen under `/<repo-navn>/`. GitHub Actions setter derfor `BASE_PATH` fra navnet på repoet, slik at en fork med et annet navn også virker. Bruker du eget domene, setter du variabelen `BASE_PATH` til `/` under Settings > Secrets and variables > Actions > Variables. Lokalt brukes `/ruter-timetable/`.
