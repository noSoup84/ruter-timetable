import { describe, expect, it } from 'vitest'
import { formatClock, formatDeparture, isDelayed, type DepartureFormat } from './format'

const now = Date.parse('2026-10-06T14:00:00+02:00')
const inSeconds = (s: number) => now + s * 1000
const format = (minutesLimit: number): DepartureFormat => ({ minutesLimit, nowText: 'nå', clockFormat: '24h' })

describe('formatDeparture', () => {
  it('shows "nå" under one minute', () => {
    expect(formatDeparture(inSeconds(0), now, format(30))).toBe('nå')
    expect(formatDeparture(inSeconds(59), now, format(30))).toBe('nå')
  })

  it('shows minutes from 1 to 30, rounded down', () => {
    expect(formatDeparture(inSeconds(60), now, format(30))).toBe('1 m')
    expect(formatDeparture(inSeconds(5 * 60 + 59), now, format(30))).toBe('5 m')
    expect(formatDeparture(inSeconds(30 * 60 + 59), now, format(30))).toBe('30 m')
  })

  it('shows clock time from 31 minutes', () => {
    expect(formatDeparture(inSeconds(31 * 60), now, format(30))).toBe('14:31')
  })

  it('shows clock time in Oslo time with two digit hours', () => {
    expect(formatDeparture(Date.parse('2026-10-07T07:05:00+02:00'), now, format(30))).toBe('07:05')
  })
})

describe('formatDeparture with another limit', () => {
  it('switches to clock time after the given number of minutes', () => {
    expect(formatDeparture(inSeconds(10 * 60), now, format(10))).toBe('10 m')
    expect(formatDeparture(inSeconds(11 * 60), now, format(10))).toBe('14:11')
  })
})

describe('formatClock', () => {
  it('formats as HH:MM', () => {
    expect(formatClock(Date.parse('2026-10-06T09:03:00+02:00'))).toBe('09:03')
  })
})

describe('12-hour clock', () => {
  it('formats as h:MM AM/PM without a leading zero', () => {
    expect(formatClock(Date.parse('2026-10-06T14:05:00+02:00'), '12h')).toBe('2:05 PM')
    expect(formatClock(Date.parse('2026-10-06T00:30:00+02:00'), '12h')).toBe('12:30 AM')
  })

  it('is used for departures past the minutes limit', () => {
    expect(formatDeparture(inSeconds(31 * 60), now, { ...format(30), clockFormat: '12h' })).toBe('2:31 PM')
  })
})

describe('isDelayed', () => {
  it('is delayed only when more than two minutes late', () => {
    expect(isDelayed(now, inSeconds(120))).toBe(false)
    expect(isDelayed(now, inSeconds(121))).toBe(true)
    expect(isDelayed(now, inSeconds(-60))).toBe(false)
  })
})
