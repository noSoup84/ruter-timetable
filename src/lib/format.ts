const MINUTE = 60_000

/** Delays longer than this are shown with the aimed time struck through. */
export const DELAY_LIMIT_MINUTES = 2

export type ClockFormat = '24h' | '12h'

export const CLOCK_FORMATS: ClockFormat[] = ['24h', '12h']

// 24h is "14:05". 12h is "2:05 PM", in English for both languages, since
// Norwegian has no common 12-hour style.
const CLOCK: Record<ClockFormat, Intl.DateTimeFormat> = {
  '24h': new Intl.DateTimeFormat('nb-NO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' }),
  '12h': new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Europe/Oslo' }),
}

export function formatClock(time: number, format: ClockFormat = '24h'): string {
  return CLOCK[format].format(time)
}

export interface DepartureFormat {
  /** Departures more than this many minutes away are shown as clock time. */
  minutesLimit: number
  /** Text for departures under a minute away, like "nå". */
  nowText: string
  clockFormat: ClockFormat
}

/** Formats a departure as "nå", "X m" or clock time, relative to now. */
export function formatDeparture(expected: number, now: number, format: DepartureFormat): string {
  const minutes = Math.floor((expected - now) / MINUTE)
  if (minutes < 1) return format.nowText
  if (minutes <= format.minutesLimit) return `${minutes} m`
  return formatClock(expected, format.clockFormat)
}

export function isDelayed(aimed: number, expected: number): boolean {
  return expected - aimed > DELAY_LIMIT_MINUTES * MINUTE
}
