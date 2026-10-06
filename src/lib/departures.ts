import type { TransportMode } from './config'
import type { Departure, LineColours, Notice } from './entur'
import type { LocalizedText } from './i18n'

export const DEPARTURES_SHOWN = 3

/** Returns the next departures that have not left yet. */
export function upcoming(departures: Departure[], now: number, count = DEPARTURES_SHOWN): Departure[] {
  return departures
    .filter((d) => d.expected > now)
    .sort((a, b) => a.expected - b.expected)
    .slice(0, count)
}

/** Returns the first situation text on any of the departures. */
export function firstSituation(departures: Departure[]): LocalizedText | null {
  return departures.find((d) => d.situations.length > 0)?.situations[0] ?? null
}

/** Returns the general notices on any of the departures, without duplicates. */
export function notices(departures: Departure[]): Notice[] {
  const unique = new Map<string, Notice>()
  for (const notice of departures.flatMap((d) => d.notices)) unique.set(JSON.stringify(notice.summary), notice)
  return [...unique.values()]
}

/** Ruter's colours as registered in Entur, used when a line has none. */
const FALLBACK_COLOURS: Record<TransportMode, string> = {
  bus: 'E60000',
  tram: '0B91EF',
  metro: 'EC700C',
  water: '682C88',
  rail: '6B6B6B',
}

export function badgeColours(mode: TransportMode, colours: LineColours | null): { background: string; color: string } {
  return {
    background: `#${colours?.colour ?? FALLBACK_COLOURS[mode]}`,
    color: `#${colours?.textColour ?? 'FFFFFF'}`,
  }
}
