# Todo og feedback

Feedback og oppgaver for appen. Nye punkter legges under "Åpne". Når et punkt er gjort, flyttes det til "Ferdig" med dato og commit.

## Åpne

- [ ] Linjenummeret vises to ganger på skjermen, fordi det står både i merket og i det foreslåtte navnet ("54 mot Kjelsås"). Vurder å la navneforslaget droppe nummeret. (2026-10-06)
- [ ] På config-siden har alle bussmerker rød farge, også regionbusser som skal være grønne. Listen henter ikke linjefarger fra Entur. (2026-10-06)
- [ ] Test posisjon og holdeplasser i nærheten på et ekte nettbrett over HTTPS. (2026-10-06)

## Ferdig

- [x] Spørsmålet om posisjon kom hver gang man la til en avgang. Nå spørres det maks én gang per besøk, og ikke i det hele tatt hvis nettleseren allerede har gitt tillatelse. (2026-10-06, 7ddc08d)
- [x] Man måtte gå gjennom hele flyten for hver avgang. Nå viser "Legg til avganger" alle holdeplasser og retninger i nærheten med avkrysningsbokser, så flere avganger fra flere holdeplasser legges til i én operasjon. (2026-10-06, 7ddc08d)
- [x] Config-siden trenger en knapp som fjerner alle innstillinger og posisjonsdeling og sender deg til forsiden. Nettleserens egen posisjonstillatelse kan ikke fjernes fra appen. (2026-10-06, ead35e3)
- [x] Nærhetsgrensen for holdeplasser skal være 250 m, ikke 1 km. (2026-10-06, 067adf7)
- [x] Generell info som "Fra 4. oktober: Buss 54 får økt frekvens" skal ikke vises, bare driftsvarsler. Filtrerer nå på `reportType: incident`. (2026-10-06, 3687428)
- [x] Generell info skal kunne leses ved å trykke på en liten info-knapp som åpner en snakkeboble. (2026-10-06, cf00734)
- [x] Tavla brukte for lite av skjermen på iPad. Skriften skaleres nå etter både høyde og bredde, og radene fyller høyden. (2026-10-06, 510fa54)
- [x] Info-knappen flyttes til en liten hvit sirkel med sort "i" i hjørnet av linjemerket, og trykk på merket åpner boblen. Det sparer plass i bredden. (2026-10-06, 6d41525)
- [x] Trykk på tidene viser dem som klokkeslett (HH:MM) i 5 sekunder. (2026-10-06, 6d41525)
- [x] Info-indikatoren så ikke bra ut, og skal være gul. Den er nå et SVG-ikon, gul sirkel med sort "i". (2026-10-06, ef2b963)
- [x] Info-boblen skal ha hvit kant. (2026-10-06, 33569b8)
- [x] Info-boblen skal lukkes av seg selv etter 10 sekunder uten trykk. (2026-10-06, 0b86eb9)
- [x] Info-boblen på nederste rad havnet utenfor skjermen. Rader i nedre halvdel åpner den nå oppover. (2026-10-06, 0b86eb9)
- [x] Config-siden skal være tilpasset nettbrett og ha plass til virtuelt tastatur. "Tilbake til avganger" skal være en knapp til venstre. (2026-10-06, 4dea93f)
- [x] "min" skrives som "m", for eksempel "5 m". (2026-10-06, 4dea93f)
- [x] Pilknappene for å flytte avganger erstattes med dra og slipp. (2026-10-06, 57f41d8)
- [x] Knappen "Last inn siden på nytt" flyttes til samme linje som klokkeslettet for automatisk omlasting, til høyre for feltet. (2026-10-06, 57f41d8)
- [x] Grensen for når minutter byttes til klokkeslett, og nærhetsgrensen for holdeplasser (standard 250 m), skal kunne endres i config. (2026-10-06, 9691b0a)
- [x] Den blå knappen "Legg til avganger" passer ikke med temaet. Hovedknapper, valgte rader og avkrysningsbokser er nå hvite i stedet for blå. (2026-10-06, 9691b0a)
- [x] Repoet er pushet til noSoup84/ruter-timetable, og appen kjører på https://nosoup84.github.io/ruter-timetable/ via GitHub Pages. (2026-10-06, 790f8c2)
- [x] Tannhjulet kom i konflikt med tidene i nederste rad. Det står nå øverst til venstre, og klokka øverst til høyre. (2026-10-06, 7bb918f)
- [x] Import-lenken er testet på GitHub Pages, både i ny fane og i samme fane, og virker. (2026-10-06)
