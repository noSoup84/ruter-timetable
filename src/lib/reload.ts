/** Returns the first time after `from` that matches "HH:MM" in local time. */
export function nextReloadTime(from: number, time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date(from)
  next.setHours(hours, minutes, 0, 0)
  if (next.getTime() <= from) next.setDate(next.getDate() + 1)
  return next.getTime()
}
