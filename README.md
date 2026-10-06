# Ruter avgangstavle

Viser sanntidsavganger fra Entur på et nettbrett. Se `SPEC.md` for hva appen gjør.

```sh
npm install
npm run dev     # utviklingsserver på http://localhost:5173/ruter-timetable/
npm test        # enhetstester
npm run build   # bygger til dist/
```

Push til `main` kjører tester og deployer til GitHub Pages. Under Settings > Pages i repoet må "Source" være satt til "GitHub Actions".
