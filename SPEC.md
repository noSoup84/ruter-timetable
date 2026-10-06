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
    maximumDistance: 250
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

Linjer og retninger fra en holdeplass. Vi henter én avgang per linje og endestasjon for hver plattform den neste uka:

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

En retning er kombinasjonen av plattform (quay) og linje. Vi bruker avganger i stedet for journey patterns, fordi teksten på bussen (`frontText`) kan være en annen enn navnet på siste stopp, for eksempel "Sinsen-Grefsen st." mot "Grefsen stasjon". Linjer som ikke går fra plattformen den neste uka, vises ikke.

Vi filtrerer ikke på endestasjon. Samme linje har ofte flere endestasjoner i samme retning, for eksempel 17 mot Gaustadalléen og Jernbanetorget fra samme plattform, og begge skal vises.

Hente avganger, med alias per rad i samme spørring. Verdiene sendes som GraphQL-variabler:

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

Vi henter 6 avganger og viser 3, slik at raden fortsatt har 3 avganger når de første går mellom to hentinger.

## Avgangsvisning (`/`)

### Layout

- Mørk bakgrunn med lys tekst. Ingen lys modus.
- Stor klokke øverst (HH:MM). Ingen dato.
- Én kolonne med rader, i rekkefølgen brukeren har satt i config.
- Tavla fyller hele skjermen. Skriftstørrelsen er den største som får plass både i høyden (klokke og alle rader) og i bredden (merke, navn og tre tider). Det regnes med minst 3 rader, slik at en kort liste ikke gir enorm tekst. Radene deler høyden som er igjen.
- Et lite, svakt synlig tannhjul i et hjørne åpner `/config`.

### En rad

- Linjemerke med linjenummeret, i linjens farge fra `presentation.colour` og `presentation.textColour` i APIet. For Ruter er det rødt for bybuss, grønt for regionbuss, oransje for t-bane, blått for trikk og lilla for båt. Tog har Vy sine farger. Hvis feltet mangler, brukes fallback per transportmiddel (se under).
- Radens navn, valgt av brukeren (for eksempel "54 mot Kjelsås").
- Opptil 3 kommende avganger.
- Hvis det finnes aktive driftsvarsler: et varselikon og den norske `summary`-teksten på én linje under raden, avkortet med ellipse. Er det flere, vises det første. Bare varsler med `reportType: incident` vises, for eksempel "Buss for trikk", omkjøring og flyttet holdeplass. Varsler med `reportType: general` er generell info, for eksempel "Buss 54 får økt frekvens", og vises ikke under raden. `severity` er "normal" på alle Ruters varsler (sjekket 2026-10-06), så den brukes ikke.
- Hvis det finnes generell info, får linjemerket en liten gul sirkel med sort "i" i øvre venstre hjørne. Trykk på linjemerket åpner en snakkeboble med hvit kant under merket, med `summary` og `description` for hvert varsel. Bare én boble er åpen om gangen. Den lukkes ved nytt trykk på merket, trykk utenfor boblen, eller av seg selv etter 20 sekunder, slik at tavla ikke blir stående med en åpen boble.
- Trykk på tidene i en rad viser alle tidene i raden som klokkeslett (HH:MM) i 5 sekunder. Nytt trykk bytter tilbake med en gang.
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

- Hver rad viser linjemerke, navn og holdeplass.
- Endre navn direkte i listen. Skal linje, holdeplass eller retning endres, lager man en ny rad og sletter den gamle.
- Slette rad, med bekreftelse.
- Flytte opp og ned med piler.
- Knapp "Legg til avganger".
- Ingen grense på antall rader, men layouten er laget for rundt 3 til 8.

### Legge til avganger

Flere avganger fra flere holdeplasser legges til i én operasjon, ved å krysse av i en liste.

1. Første gang i et besøk spør appen om den skal bruke posisjonen din. Hvis nettleseren allerede har gitt tillatelse, hoppes spørsmålet over.
2. Med posisjon: appen viser de 10 nærmeste holdeplassene innen 250 m, sortert på avstand. Under hver holdeplass står alle linjer og retninger derfra, med avkrysningsboks. Alt hentes i én spørring mot Entur.
3. Over listen er det et søkefelt. Et treff i søket legges øverst i listen som en ny holdeplass med sine retninger. Uten posisjon starter listen tom, og søket er eneste vei inn.
4. Filterknapper for transportmiddel (buss, t-bane, trikk, tog, ferje) gjelder hele listen. Bare transportmidler som finnes i listen, vises.
5. Retninger som allerede er lagt til, er avkrysset, grået ut og merket "Lagt til".
6. Knappen "Legg til N avganger" lagrer alle avkryssede retninger nederst i listen. Navnet blir linjenummer og første endestasjon ("54 mot Kjelsås stasjon"), og kan endres i listen etterpå.

Eksempel: hjemme ved Kværnerbyen krysser man av 54 fra Kværnerbyen og 70 og 34 i begge retninger fra Kværner, og legger til alle fem med ett trykk.

### Posisjon

- Posisjon hentes med `navigator.geolocation` bare når brukeren takker ja, eller nettleseren allerede har gitt tillatelse. Avgangsvisningen ber aldri om posisjon.
- Svaret på spørsmålet og selve posisjonen huskes resten av besøket, slik at man ikke blir spurt på nytt. Ingenting lagres i localStorage, slik at forslagene stemmer når appen settes opp et annet sted.
- Hvis brukeren sier nei, nettleseren avslår, eller posisjonen ikke kommer innen 10 sekunder, viser appen bare søkefeltet.
- Geolocation krever HTTPS, noe GitHub Pages har. I Fully Kiosk Browser må posisjonstilgang slås på i appens innstillinger.

### Andre innstillinger

- Automatisk omlasting: av/på og klokkeslett.
- Knapp "Last inn siden på nytt".
- Knapp "Tilbakestill alt", med bekreftelse. Den sletter oppsettet i localStorage, glemmer svaret om posisjon og laster forsiden på nytt. Nyttig ved testing. Tillatelsen nettleseren har gitt til posisjon, kan ikke fjernes fra JavaScript, og må fjernes i nettleserens innstillinger for nettstedet.

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
      "stopName": "Kværnerbyen"
    }
  ],
  "autoReload": { "enabled": true, "time": "04:00" }
}
```

`publicCode` og `stopName` lagres for å vise config-siden uten API-kall.

Ugyldig eller manglende oppsett gir en tom avgangsvisning med en lenke til config-siden.

## Tester

Enhetstester med Vitest for:

- Tidsformatet (`nå`, `X min`, `HH:MM`, grensene på 1 og 30 minutter).
- Forsinkelse og innstilling.
- Fjerning av avganger som har gått.
- Lesing, validering og migrering av oppsett fra `localStorage`.
- Koding og dekoding av eksportlenken.
- Utledning av linjer og retninger fra avgangene på en holdeplass.

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

Hvis Entur returnerer `null` for quayen eller linjen til en rad, viser raden "Finner ikke linjen" i svak farge og en lenke til config-siden. Et vanlig svar uten avganger gir fortsatt "Ingen avganger".
