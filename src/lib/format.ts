const MINUTE = 60_000

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

/**
 * Formats a departure as "nå", "X m" or "HH:MM", relative to now.
 * Departures more than `minutesLimit` minutes away are shown as clock time.
 */
export function formatDeparture(expected: number, now: number, minutesLimit: number): string {
  const minutes = Math.floor((expected - now) / MINUTE)
  if (minutes < 1) return 'nå'
  if (minutes <= minutesLimit) return `${minutes} m`
  return formatClock(expected)
}

export function isDelayed(aimed: number, expected: number): boolean {
  return expected - aimed > DELAY_LIMIT_MINUTES * MINUTE
}
