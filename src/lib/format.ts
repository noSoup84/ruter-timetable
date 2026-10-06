const MINUTE = 60_000

/** Departures more than this many minutes away are shown as clock time. */
export const MINUTES_LIMIT = 30

/** Delays longer than this are shown with the aimed time struck through. */
export const DELAY_LIMIT_MINUTES = 2

const clockFormat = new Intl.DateTimeFormat('nb-NO', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Oslo',
})

export function formatClock(time: number): string {
  return clockFormat.format(time)
}

/** Formats a departure as "nå", "X m" or "HH:MM", relative to now. */
export function formatDeparture(expected: number, now: number): string {
  const minutes = Math.floor((expected - now) / MINUTE)
  if (minutes < 1) return 'nå'
  if (minutes <= MINUTES_LIMIT) return `${minutes} m`
  return formatClock(expected)
}

export function isDelayed(aimed: number, expected: number): boolean {
  return expected - aimed > DELAY_LIMIT_MINUTES * MINUTE
}
