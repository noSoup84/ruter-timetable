import { describe, expect, it } from 'vitest'
import type { BoardRow } from './config'
import {
  buildDeparturesQuery,
  buildDirectionsQuery,
  parseDepartures,
  parseDirections,
  toTransportMode,
  type RawStopPlace,
} from './entur'
import directionsFixture from './__fixtures__/directions-heimdalsgata.json'

const row = (id: string, quayId: string, lineId: string): BoardRow => ({
  id,
  name: id,
  transportMode: 'bus',
  lineId,
  publicCode: '54',
  quayId,
  stopName: 'Kværnerbyen',
})

const rows = [row('a', 'NSR:Quay:105467', 'RUT:Line:54'), row('b', 'NSR:Quay:1', 'RUT:Line:1')]

describe('buildDeparturesQuery', () => {
  it('passes quay and line IDs as variables, with one alias pair per row', () => {
    const { query, variables } = buildDeparturesQuery(rows)
    expect(variables).toEqual({ q0: 'NSR:Quay:105467', l0: 'RUT:Line:54', q1: 'NSR:Quay:1', l1: 'RUT:Line:1' })
    expect(query).toContain('query ($q0: String!, $l0: ID!, $q1: String!, $l1: ID!)')
    expect(query).toContain('q1: quay(id: $q1)')
    expect(query).not.toContain('NSR:Quay')
  })
})

describe('parseDepartures', () => {
  it('parses departures, colours and incident texts in each language', () => {
    const results = parseDepartures(rows.slice(0, 1), {
      q0: {
        id: 'NSR:Quay:105467',
        estimatedCalls: [
          {
            aimedDepartureTime: '2026-10-06T10:45:00+02:00',
            expectedDepartureTime: '2026-10-06T10:45:40+02:00',
            realtime: true,
            cancellation: false,
            destinationDisplay: { frontText: 'Kjelsås stasjon' },
            situations: [
              {
                reportType: 'general',
                summary: [{ value: 'Fra 4. oktober: Buss 54 får økt frekvens', language: 'no' }],
                description: [{ value: 'Bussen går hvert 10. minutt.', language: 'no' }],
              },
              {
                reportType: 'incident',
                summary: [
                  { value: 'Bus 54 is diverted', language: 'en' },
                  { value: 'Buss 54 har omkjøring', language: 'no' },
                ],
                description: [],
              },
            ],
          },
        ],
      },
      l0: { id: 'RUT:Line:54', presentation: { colour: 'E60000', textColour: 'FFFFFF' } },
    })

    // The incident goes under the row and the general notice to the info bubble, both in every language Entur sends.
    expect(results.get('a')).toEqual({
      found: true,
      departures: [
        {
          aimed: Date.parse('2026-10-06T10:45:00+02:00'),
          expected: Date.parse('2026-10-06T10:45:40+02:00'),
          realtime: true,
          cancelled: false,
          destination: 'Kjelsås stasjon',
          situations: [{ no: 'Buss 54 har omkjøring', en: 'Bus 54 is diverted' }],
          notices: [
            { summary: { no: 'Fra 4. oktober: Buss 54 får økt frekvens' }, description: { no: 'Bussen går hvert 10. minutt.' } },
          ],
        },
      ],
      colours: { colour: 'E60000', textColour: 'FFFFFF' },
    })
  })

  it('marks rows as not found when the quay or line is missing', () => {
    const results = parseDepartures(rows, {
      q0: null,
      l0: { id: 'RUT:Line:54', presentation: null },
      q1: { id: 'NSR:Quay:1', estimatedCalls: [] },
      l1: null,
    })
    expect(results.get('a')).toEqual({ found: false })
    expect(results.get('b')).toEqual({ found: false })
  })
})

describe('parseDirections', () => {
  it('groups departures into one option per quay and line, with all destinations', () => {
    const options = parseDirections(directionsFixture.stopPlace as RawStopPlace)
    const summary = options.map((o) => `${o.quayId} ${o.publicCode}: ${o.destinations.join(', ')}`)

    expect(summary).toContain('NSR:Quay:104054 17: Gaustadalléen, Jernbanetorget')
    expect(summary).toContain('NSR:Quay:104055 17: Sinsen-Grefsen st.')
    expect(summary).toContain('NSR:Quay:11873 92: Jernbanetorget')
    expect(options.every((o) => o.transportMode === 'tram' || o.transportMode === 'bus')).toBe(true)
  })

  it('sorts lines by number', () => {
    const options = parseDirections(directionsFixture.stopPlace as RawStopPlace)
    const codes = options.map((o) => o.publicCode)
    expect(codes).toEqual([...codes].sort((a, b) => a.localeCompare(b, 'nb', { numeric: true })))
  })

  it('returns no options when the stop does not exist', () => {
    expect(parseDirections(null)).toEqual([])
  })
})

describe('buildDirectionsQuery', () => {
  it('fetches all stops in one query, with IDs as variables', () => {
    const { query, variables } = buildDirectionsQuery(['NSR:StopPlace:6552', 'NSR:StopPlace:58253'])
    expect(variables).toEqual({ s0: 'NSR:StopPlace:6552', s1: 'NSR:StopPlace:58253' })
    expect(query).toContain('s1: stopPlace(id: $s1) { ...StopDirections }')
    expect(query).toContain('fragment StopDirections on StopPlace')
  })
})

describe('toTransportMode', () => {
  it('maps coach to bus and drops unsupported modes', () => {
    expect(toTransportMode('coach')).toBe('bus')
    expect(toTransportMode('metro')).toBe('metro')
    expect(toTransportMode('air')).toBeNull()
  })
})
