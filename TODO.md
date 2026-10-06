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
- [x] Nærhetsgrensen for holdeplasser skal være 250 m, ikke 1 km. (2026-10-06, COMMIT)
