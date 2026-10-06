import { describe, expect, it } from 'vitest'
import { nextReloadTime } from './reload'

describe('nextReloadTime', () => {
  it('returns the same day when the time is later today', () => {
    const from = Date.parse('2026-10-06T01:00:00+02:00')
    expect(nextReloadTime(from, '04:00')).toBe(Date.parse('2026-10-06T04:00:00+02:00'))
  })

  it('returns the next day when the time has passed', () => {
    const from = Date.parse('2026-10-06T04:00:00+02:00')
    expect(nextReloadTime(from, '04:00')).toBe(Date.parse('2026-10-07T04:00:00+02:00'))
  })
})
