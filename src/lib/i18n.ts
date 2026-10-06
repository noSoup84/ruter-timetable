export type Language = 'no' | 'en'

export const LANGUAGES: Language[] = ['no', 'en']

export const DEFAULT_LANGUAGE: Language = 'no'

/** BCP 47 tags for the `lang` attribute and date formatting. */
export const LANGUAGE_TAGS: Record<Language, string> = { no: 'nb', en: 'en' }

// Norwegian is the source. Placeholders are written as {name}.
const no = {
  'app.title': 'Avganger',

  'board.settings': 'Innstillinger',
  'board.empty': 'Ingen avganger er satt opp.',
  'board.setUp': 'Sett opp avganger',
  'board.noContact': 'Får ikke kontakt med Entur',
  'board.lastUpdated': 'Sist oppdatert {time}',

  'row.now': 'nå',
  'row.cancelled': 'Innstilt',
  'row.noDepartures': 'Ingen avganger',
  'row.notFound': 'Finner ikke linjen',
  'row.edit': 'Endre',
  'row.showInfo': 'Vis informasjon',
  'row.defaultName': '{line} mot {destination}',

  'config.back': '← Avganger',
  'config.title': 'Innstillinger',
  'config.language': 'Språk',
  'config.departures': 'Avganger',
  'config.noRows': 'Ingen avganger er lagt til ennå.',
  'config.dragHandle': 'Dra for å flytte',
  'config.name': 'Navn',
  'config.from': 'Fra {stop}',
  'config.delete': 'Slett',
  'config.confirmDelete': 'Slette "{name}"?',
  'config.maxRows': 'Du har nådd grensen på {max} avganger.',
  'config.addDepartures': 'Legg til avganger',
  'config.display': 'Visning og søk',
  'config.minutesBefore': 'Vis minutter til avgang opp til',
  'config.minutesAfter': 'minutter, deretter klokkeslett',
  'config.distanceBefore': 'Vis holdeplasser i nærheten innen',
  'config.distanceAfter': 'meter',
  'config.clockFormat': 'Klokkeformat',
  'config.autoReload': 'Automatisk omlasting',
  'config.autoReloadHint': 'Laster siden på nytt én gang i døgnet, slik at nye versjoner kommer ut.',
  'config.autoReloadLabel': 'Last inn på nytt hver dag klokka',
  'config.reloadNow': 'Last inn siden på nytt',
  'config.export': 'Eksport',
  'config.exportHint': 'Lag en lenke med hele oppsettet. Åpne lenken på en annen enhet for å kopiere oppsettet dit.',
  'config.createLink': 'Lag lenke',
  'config.copy': 'Kopier',
  'config.copied': 'Kopiert',
  'config.reset': 'Tilbakestill',
  'config.resetHint':
    'Sletter alle avganger og innstillinger på denne enheten, og glemmer svaret om posisjon. Tillatelsen nettleseren har gitt til posisjon, må fjernes i nettleserens innstillinger for nettstedet.',
  'config.resetButton': 'Tilbakestill alt',
  'config.confirmReset': 'Slette alle avganger og innstillinger på denne enheten?',

  'add.askPosition': 'Vil du se avganger i nærheten?',
  'add.positionHint': 'Posisjonen brukes bare til å finne holdeplasser, og lagres ikke.',
  'add.usePosition': 'Bruk posisjonen min',
  'add.searchInstead': 'Søk i stedet',
  'add.cancel': 'Avbryt',
  'add.title': 'Velg avganger',
  'add.searchPlaceholder': 'Søk etter holdeplass',
  'add.all': 'Alle',
  'add.loading': 'Henter avganger...',
  'add.to': 'mot {destinations}',
  'add.added': 'Lagt til',
  'add.platform': 'Plattform {code}',
  'add.addOne': 'Legg til 1 avgang',
  'add.addMany': 'Legg til {count} avganger',
  'add.noneNearby': 'Fant ingen avganger innen {distance} m. Søk etter holdeplassen i stedet.',
  'add.noPosition': 'Fant ikke posisjonen din. Søk etter holdeplassen i stedet.',
  'add.searchFailed': 'Søket feilet. Prøv igjen.',
  'add.noneFromStop': 'Ingen avganger fra {stop} den neste uka.',
  'add.linesFailed': 'Klarte ikke å hente linjer. Prøv igjen.',

  'mode.bus': 'Buss',
  'mode.metro': 'T-bane',
  'mode.tram': 'Trikk',
  'mode.rail': 'Tog',
  'mode.water': 'Ferje',

  'import.title': 'Importer oppsett',
  'import.contains': 'Lenken inneholder disse avgangene:',
  'import.from': 'fra {stop}',
  'import.replaces': 'Dette erstatter de {count} avgangene som er satt opp på denne enheten.',
  'import.confirm': 'Bruk dette oppsettet',
  'import.cancel': 'Avbryt',
  'import.invalid': 'Lenken er ugyldig eller ufullstendig.',
  'import.toSettings': 'Til innstillinger',
}

export type MessageKey = keyof typeof no

const en: Record<MessageKey, string> = {
  'app.title': 'Departures',

  'board.settings': 'Settings',
  'board.empty': 'No departures are set up.',
  'board.setUp': 'Set up departures',
  'board.noContact': 'Cannot reach Entur',
  'board.lastUpdated': 'Last updated {time}',

  'row.now': 'now',
  'row.cancelled': 'Cancelled',
  'row.noDepartures': 'No departures',
  'row.notFound': 'Line not found',
  'row.edit': 'Edit',
  'row.showInfo': 'Show information',
  'row.defaultName': '{line} to {destination}',

  'config.back': '← Departures',
  'config.title': 'Settings',
  'config.language': 'Language',
  'config.departures': 'Departures',
  'config.noRows': 'No departures added yet.',
  'config.dragHandle': 'Drag to move',
  'config.name': 'Name',
  'config.from': 'From {stop}',
  'config.delete': 'Delete',
  'config.confirmDelete': 'Delete "{name}"?',
  'config.maxRows': 'You have reached the limit of {max} departures.',
  'config.addDepartures': 'Add departures',
  'config.display': 'Display and search',
  'config.minutesBefore': 'Show minutes to departure up to',
  'config.minutesAfter': 'minutes, then clock time',
  'config.distanceBefore': 'Show nearby stops within',
  'config.distanceAfter': 'meters',
  'config.clockFormat': 'Time format',
  'config.autoReload': 'Automatic reload',
  'config.autoReloadHint': 'Reloads the page once a day, so new versions roll out.',
  'config.autoReloadLabel': 'Reload every day at',
  'config.reloadNow': 'Reload page',
  'config.export': 'Export',
  'config.exportHint': 'Create a link with the whole setup. Open the link on another device to copy the setup there.',
  'config.createLink': 'Create link',
  'config.copy': 'Copy',
  'config.copied': 'Copied',
  'config.reset': 'Reset',
  'config.resetHint':
    "Deletes all departures and settings on this device, and forgets the answer about location. The location permission the browser has given must be removed in the browser's settings for the site.",
  'config.resetButton': 'Reset everything',
  'config.confirmReset': 'Delete all departures and settings on this device?',

  'add.askPosition': 'Do you want to see nearby departures?',
  'add.positionHint': 'Your location is only used to find stops, and is not stored.',
  'add.usePosition': 'Use my location',
  'add.searchInstead': 'Search instead',
  'add.cancel': 'Cancel',
  'add.title': 'Choose departures',
  'add.searchPlaceholder': 'Search for a stop',
  'add.all': 'All',
  'add.loading': 'Fetching departures...',
  'add.to': 'to {destinations}',
  'add.added': 'Added',
  'add.platform': 'Platform {code}',
  'add.addOne': 'Add 1 departure',
  'add.addMany': 'Add {count} departures',
  'add.noneNearby': 'Found no departures within {distance} m. Search for the stop instead.',
  'add.noPosition': 'Could not find your location. Search for the stop instead.',
  'add.searchFailed': 'Search failed. Try again.',
  'add.noneFromStop': 'No departures from {stop} in the next week.',
  'add.linesFailed': 'Could not fetch lines. Try again.',

  'mode.bus': 'Bus',
  'mode.metro': 'Metro',
  'mode.tram': 'Tram',
  'mode.rail': 'Train',
  'mode.water': 'Ferry',

  'import.title': 'Import setup',
  'import.contains': 'The link has these departures:',
  'import.from': 'from {stop}',
  'import.replaces': 'This replaces the {count} departures set up on this device.',
  'import.confirm': 'Use this setup',
  'import.cancel': 'Cancel',
  'import.invalid': 'The link is invalid or incomplete.',
  'import.toSettings': 'Go to settings',
}

const MESSAGES: Record<Language, Record<MessageKey, string>> = { no, en }

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language)
}

/** Returns the text for a key, with {name} placeholders filled in from params. */
export function translate(language: Language, key: MessageKey, params: Record<string, string | number> = {}): string {
  return MESSAGES[language][key].replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

/** Text from Entur in several languages. */
export type LocalizedText = Partial<Record<Language, string>>

/** Picks the text in the given language, falling back to Norwegian and then any other. */
export function pickText(text: LocalizedText, language: Language): string {
  return text[language] ?? text.no ?? Object.values(text)[0] ?? ''
}
