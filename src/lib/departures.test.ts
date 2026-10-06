import { describe, expect, it } from 'vitest'
import { badgeColours, firstSituation, notices, upcoming } from './departures'
import type { Departure } from './entur'

const now = Date.parse('2026-10-06T14:00:00+02:00')

function departure(minutes: number, overrides: Partial<Departure> = {}): Departure {
  const time = now + minutes * 60_000
  return {
    aimed: time,
    expected: time,
    realtime: true,
    cancelled: false,
    destination: 'Kjelsås stasjon',
    situations: [],
    notices: [],
    ...overrides,
  }
}

describe('upcoming', () => {
  it('drops departures that have left and keeps the next three in order', () => {
    const list = [departure(10), departure(-1), departure(0), departure(2), departure(5), departure(1)]
    expect(upcoming(list, now).map((d) => d.expected)).toEqual([1, 2, 5].map((m) => now + m * 60_000))
  })

  it('keeps cancelled departures', () => {
    expect(upcoming([departure(3, { cancelled: true })], now)).toHaveLength(1)
  })
})

describe('firstSituation', () => {
  it('returns the first situation on any departure', () => {
    expect(firstSituation([departure(1), departure(2, { situations: ['Buss for trikk'] })])).toBe('Buss for trikk')
    expect(firstSituation([departure(1)])).toBeNull()
  })
})

describe('notices', () => {
  it('collects notices from all departures without duplicates', () => {
    const frequency = { summary: 'Buss 54 får økt frekvens', description: 'Fra 4. oktober' }
    const minutes = { summary: 'Minuttjusteringer', description: null }
    const list = [departure(1, { notices: [frequency] }), departure(2, { notices: [frequency, minutes] })]
    expect(notices(list)).toEqual([frequency, minutes])
  })
})

describe('badgeColours', () => {
  it('uses the line colours from Entur', () => {
    expect(badgeColours('bus', { colour: '76A300', textColour: 'FFFFFF' })).toEqual({
      background: '#76A300',
      color: '#FFFFFF',
    })
  })

  it('falls back to the colour for the transport mode', () => {
    expect(badgeColours('metro', null)).toEqual({ background: '#EC700C', color: '#FFFFFF' })
    expect(badgeColours('tram', { colour: null, textColour: null }).background).toBe('#0B91EF')
  })
})
