# Todo og feedback

Feedback og oppgaver for appen. Nye punkter legges under "Åpne". Når et punkt er gjort, flyttes det til "Ferdig" med dato og commit.

## Åpne

- [ ] Opprette offentlig GitHub-repo, pushe og slå på GitHub Pages med "GitHub Actions" som kilde. (2026-10-06)
- [ ] Linjenummeret vises to ganger på skjermen, fordi det står både i merket og i det foreslåtte navnet ("54 mot Kjelsås"). Vurder å la navneforslaget droppe nummeret. (2026-10-06)
- [ ] På config-siden har alle bussmerker rød farge, også regionbusser som skal være grønne. Listen henter ikke linjefarger fra Entur. (2026-10-06)
- [ ] Test posisjon og holdeplasser i nærheten på et ekte nettbrett over HTTPS. (2026-10-06)
- [ ] Test import-lenken i nettleseren. (2026-10-06)

## Ferdig

- [x] Spørsmålet om posisjon kom hver gang man la til en avgang. Nå spørres det maks én gang per besøk, og ikke i det hele tatt hvis nettleseren allerede har gitt tillatelse. (2026-10-06, 892f297)
- [x] Man måtte gå gjennom hele flyten for hver avgang. Nå viser "Legg til avganger" alle holdeplasser og retninger i nærheten med avkrysningsbokser, så flere avganger fra flere holdeplasser legges til i én operasjon. (2026-10-06, 892f297)
- [x] Config-siden trenger en knapp som fjerner alle innstillinger og posisjonsdeling og sender deg til forsiden. Nettleserens egen posisjonstillatelse kan ikke fjernes fra appen. (2026-10-06, ba5b22b)
- [x] Nærhetsgrensen for holdeplasser skal være 250 m, ikke 1 km. (2026-10-06, 1ccdabf)
- [x] Generell info som "Fra 4. oktober: Buss 54 får økt frekvens" skal ikke vises, bare driftsvarsler. Filtrerer nå på `reportType: incident`. (2026-10-06, f722853)
- [x] Generell info skal kunne leses ved å trykke på en liten info-knapp som åpner en snakkeboble. (2026-10-06, 65c3f5b)
- [x] Tavla brukte for lite av skjermen på iPad. Skriften skaleres nå etter både høyde og bredde, og radene fyller høyden. (2026-10-06, 0d07277)
- [x] Info-knappen flyttes til en liten hvit sirkel med sort "i" i hjørnet av linjemerket, og trykk på merket åpner boblen. Det sparer plass i bredden. (2026-10-06, 413699b)
- [x] Trykk på tidene viser dem som klokkeslett (HH:MM) i 5 sekunder. (2026-10-06, 413699b)
- [x] Info-indikatoren så ikke bra ut, og skal være gul. Den er nå et SVG-ikon, gul sirkel med sort "i". (2026-10-06, COMMIT)
