# Ruter avgangstavle

En minimalistisk webapp som viser sanntidsavganger for valgte kollektivlinjer. Den skal kjøre i fullskjerm på et nettbrett som henger i gangen, men skal kunne settes opp for hvilket som helst sted i Ruters område.

## Mål

- Vise de neste avgangene for et sett med linjer, holdeplasser og retninger som brukeren har valgt.
- Være lesbar på avstand, med lite støy på skjermen.
- Kjøre i uker uten tilsyn.
- Ingen backend, ingen innlogging, ingen API-nøkler.

## Utenfor omfang

- Reiseplanlegging fra A til B.
- Gangtid til holdeplassen og filtrering av avganger man ikke rekker.
- Dato, vær, bysykkel og annet innhold enn avganger og klokke.
- Lagring av oppsett på server eller synk mellom enheter.

## Plattform

- Brukt, relativt nytt nettbrett. Android med Fully Kiosk Browser anbefales, fordi den holder skjermen på, starter siden ved oppstart og kan dimme om natten. iPad med Guided Access fungerer også.
- Vi støtter bare moderne nettlesere (siste to versjoner av Chrome og Safari). Ingen polyfills.
- Layouten tilpasser seg stående og liggende format.

## Teknologi

- Vite, TypeScript og Vue 3.
- Vue Router med to ruter: `/` (avgangsvisning) og `/config`. Hash-modus (`/#/config`), slik at GitHub Pages ikke trenger 404-omdirigering.
- Vitest for enhetstester.
- Hosting på GitHub Pages i et offentlig repo, med deploy fra `main` via GitHub Actions. Testene må passere før deploy.
- Ingen andre runtime-avhengigheter med mindre det er et tydelig behov.

## Datakilde

All data kommer fra Entur JourneyPlanner v3:

- Endepunkt: `POST https://api.entur.io/journey-planner/v3/graphql`
- Påkrevd header: `ET-Client-Name: andersespedalen-ruter-timetable`
- Ingen nøkkel. CORS er åpent (`Access-Control-Allow-Origin: *`), så appen kaller APIet direkte fra nettleseren.
- Vi filtrerer ikke på operatør. Togene i Oslo-området kjøres av Vy og andre, ikke Ruter, og de skal være med. Det betyr også at appen virker i resten av landet.

Dette er verifisert mot APIet 2026-10-06 med linje 54 fra Kværnerbyen.

### Spørringer

Holdeplasser i nærheten av en posisjon:

```graphql
{
  nearest(
    latitude: 59.9045
    longitude: 10.7864
    maximumDistance: 1000
    filterByPlaceTypes: [stopPlace]
    filterByModes: [bus, tram, metro, rail, water]
  ) {
    edges {
      node {
        distance  # meter
        place { ... on StopPlace { id name transportMode } }
      }
    }
  }
}
```

Søke etter holdeplass på navn bruker Entur Geocoder, ikke GraphQL:

```
GET https://api.entur.io/geocoder/v1/autocomplete?text=kværnerbyen&layers=venue&size=10
```

Svaret er GeoJSON. `properties.id` er stopPlace-ID (`NSR:StopPlace:6552`), og `properties.category` gir type holdeplass (`onstreetBus`, `metroStation` og så videre). Samme `ET-Client-Name`-header gjelder.

Linjer og retninger fra en holdeplass:

```graphql
{
  stopPlace(id: "NSR:StopPlace:6552") {
    name
    quays {
      id
      publicCode
      journeyPatterns {
        line {
          id
          publicCode
          transportMode
          presentation { colour textColour }  # E60000 / FFFFFF for 54
        }
        quays { id name }
      }
    }
  }
}
```

Hvert journey pattern er en ordnet liste med plattformer (quays), og siste quay er endestasjonen. En retning er kombinasjonen av quay, linje og endestasjon. Journey patterns der valgt quay er siste stopp, er ankomster og utelates. For 54 på Kværnerbyen er `NSR:Quay:105467` retning Kjelsås stasjon, og `NSR:Quay:105466` er bare ankomst fra Kjelsås.

Hente avganger, én alias per rad i samme spørring:

```graphql
{
  r0: quay(id: "NSR:Quay:105467") {
    estimatedCalls(
      numberOfDepartures: 3
      timeRange: 86400
      whiteListed: { lines: ["RUT:Line:54"] }
    ) {
      aimedDepartureTime
      expectedDepartureTime
      realtime
      cancellation
      destinationDisplay { frontText }
      situations { summary { value language } }
    }
  }
  r1: quay(id: "...") { ... }
}
```

Hvis en rad også er filtrert på endestasjon (se config), henter vi flere enn 3 avganger og filtrerer på `destinationDisplay.frontText` i klienten.

## Avgangsvisning (`/`)

### Layout

- Mørk bakgrunn med lys tekst. Ingen lys modus.
- Stor klokke øverst (HH:MM). Ingen dato.
- Én kolonne med rader, i rekkefølgen brukeren har satt i config.
- Skriftstørrelser skaleres med skjermstørrelsen (`clamp()` og viewport-enheter).
- Et lite, svakt synlig tannhjul i et hjørne åpner `/config`.

### En rad

- Linjemerke med linjenummeret, i linjens farge fra `presentation.colour` og `presentation.textColour` i APIet. For Ruter er det rødt for bybuss, grønt for regionbuss, oransje for t-bane, blått for trikk og lilla for båt. Tog har Vy sine farger. Hvis feltet mangler, brukes fallback per transportmiddel (se under).
- Radens navn, valgt av brukeren (for eksempel "54 mot Kjelsås").
- Opptil 3 kommende avganger.
- Hvis det finnes aktive avvik: et varselikon og den norske `summary`-teksten på én linje under raden, avkortet med ellipse. Er det flere avvik, vises det første. Merk at Ruter også bruker avvik til rene informasjonsmeldinger, for eksempel "Buss 54 får økt frekvens".
- Hvis det ikke finnes kommende avganger: "Ingen avganger" i svak farge. Raden blir stående, slik at layouten ikke hopper.

### Tidsformat

Basert på `expectedDepartureTime` minus nåtid:

| Tid til avgang | Visning |
| --- | --- |
| Under 1 minutt | `nå` |
| 1 til 30 minutter | `X min` (avrundet ned) |
| Over 30 minutter | `HH:MM` |

Avganger som har gått, fjernes fra visningen lokalt uten å vente på neste henting.

### Sanntid, forsinkelse og innstilling

- `realtime: false`: tiden vises i svakere farge, slik at det er tydelig at det er rutetid.
- Forsinkelse over 2 minutter (`expected - aimed > 2 min`): den planlagte tiden vises overstreket ved siden av den forventede.
- `cancellation: true`: "Innstilt" i rødt i stedet for tiden.

### Oppdatering

- Henter fra Entur hvert 30. sekund, med én samlet spørring for alle rader.
- Teller ned lokalt hvert sekund mellom hentingene.
- Henter 24 timer frem i tid, slik at første morgenavgang vises som klokkeslett kvelden før.

### Feil og frakobling

- Ved feil beholdes siste kjente data, og nedtellingen fortsetter lokalt.
- Etter 2 minutter uten vellykket henting vises en liten tekst nederst: "Sist oppdatert HH:MM".
- Nye forsøk skjer på vanlig intervall. Ingen feilmeldinger i fullskjerm.

### Automatisk omlasting

- Siden laster seg selv på nytt én gang i døgnet. Standard klokkeslett er 04:00, og det kan endres i config. Det kan også slås av.
- Formålet er å få ut nye versjoner og å rydde minne etter lang kjøretid.

## Config-side (`/config`)

Config-siden viser de lagrede radene og lar brukeren opprette, endre, slette og flytte dem.

### Liste over rader

- Hver rad viser linjemerke, navn, holdeplass og endestasjon.
- Endre navn direkte i listen. Skal linje, holdeplass eller retning endres, lager man en ny rad og sletter den gamle.
- Slette rad, med bekreftelse.
- Flytte opp og ned med piler.
- Knapp "Legg til avgang".
- Ingen grense på antall rader, men layouten er laget for rundt 3 til 8.

### Legge til en rad

1. Appen spør om den skal bruke posisjonen din for å vise holdeplasser i nærheten.
2. Velg holdeplass.
   - Med posisjon: liste over holdeplasser innen 1 km, sortert på avstand og vist med avstand ("350 m"). Et søkefelt er tilgjengelig over listen hvis holdeplassen ikke er der.
   - Uten posisjon: søkefelt med forslag mens du skriver (Entur Geocoder).
3. Velg linje og retning. Appen viser alle linjer som går fra holdeplassen, én linje per retning, for eksempel "54 mot Kjelsås stasjon". Øverst er det filterknapper for transportmiddel (buss, t-bane, trikk, tog, ferje). Bare transportmidler som finnes på holdeplassen, vises.
4. Navnet fylles ut automatisk ("54 mot Kjelsås stasjon") og kan endres.
5. Lagre. Raden legges nederst i listen.

Hvis samme linje har flere endestasjoner fra samme quay, for eksempel 17 mot både Disen og Grefsen stasjon, vises de som separate valg. Raden lagrer da endestasjonen som filter.

### Posisjon

- Posisjon hentes med `navigator.geolocation` bare når brukeren takker ja i steg 1. Avgangsvisningen ber aldri om posisjon.
- Posisjonen lagres ikke. Den hentes på nytt hver gang en ny rad legges til, slik at forslagene stemmer også når appen settes opp et annet sted.
- Hvis brukeren sier nei, nettleseren avslår, eller posisjonen ikke kommer innen 10 sekunder, går appen rett til søkefeltet.
- Geolocation krever HTTPS, noe GitHub Pages har. I Fully Kiosk Browser må posisjonstilgang slås på i appens innstillinger.

### Andre innstillinger

- Automatisk omlasting: av/på og klokkeslett.
- Knapp "Last inn siden på nytt".

### Eksport og import

- Knapp som lager en lenke med hele oppsettet kodet i URL-en (base64url av JSON), for eksempel `https://<bruker>.github.io/ruter-timetable/#/import?c=...`.
- Når lenken åpnes, vises oppsettet med en bekreftelse før det erstatter eksisterende oppsett.
- Brukes til å sette opp på PC og overføre til nettbrettet, og som backup.

## Lagring

Oppsettet lagres i `localStorage` under én nøkkel, med versjonsnummer slik at formatet kan endres senere:

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
      "stopName": "Kværnerbyen",
      "destination": null
    }
  ],
  "autoReload": { "enabled": true, "time": "04:00" }
}
```

`publicCode` og `stopName` lagres for å vise config-siden uten API-kall. `destination` er `null` når quay alene bestemmer retningen.

Ugyldig eller manglende oppsett gir en tom avgangsvisning med en lenke til config-siden.

## Tester

Enhetstester med Vitest for:

- Tidsformatet (`nå`, `X min`, `HH:MM`, grensene på 1 og 30 minutter).
- Forsinkelse og innstilling.
- Filtrering på endestasjon og fjerning av avganger som har gått.
- Lesing, validering og migrering av oppsett fra `localStorage`.
- Koding og dekoding av eksportlenken.
- Utledning av linjer og retninger fra en holdeplass sine journey patterns, inkludert utelating av ankomster.

APIet testes ikke direkte. Svar fra Entur lagres som fixtures.

## Fallback-farger

Brukes når `presentation.colour` mangler. Verdiene er Ruters farger slik de er registrert hos Entur (sjekket 2026-10-06). Tekst er hvit på alle.

| Transportmiddel | Farge |
| --- | --- |
| Buss | `#E60000` |
| Trikk | `#0B91EF` |
| T-bane | `#EC700C` |
| Båt | `#682C88` |
| Tog og ukjent | `#6B6B6B` |

## Linje eller holdeplass som er borte

Hvis Entur ikke returnerer quayen for en rad, eller linjen ikke lenger har journey patterns fra quayen, viser raden "Finner ikke linjen" i svak farge og en lenke til config-siden. Vi skiller ikke dette fra "Ingen avganger" ved vanlige svar uten avganger, bare når quayen eller linjen mangler i svaret.
