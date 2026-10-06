import type { BoardRow, TransportMode } from './config'

const JOURNEY_PLANNER = 'https://api.entur.io/journey-planner/v3/graphql'
const GEOCODER = 'https://api.entur.io/geocoder/v1/autocomplete'
const CLIENT_NAME = 'andersespedalen-ruter-timetable'

/** Departures fetched per row. More than we show, so rows stay full between fetches. */
const DEPARTURES_PER_ROW = 6

export interface Departure {
  aimed: number
  expected: number
  realtime: boolean
  cancelled: boolean
  destination: string
  situations: string[]
}

export interface LineColours {
  colour: string | null
  textColour: string | null
}

export type RowResult =
  | { found: false }
  | { found: true; departures: Departure[]; colours: LineColours }

export interface StopOption {
  id: string
  name: string
  description: string | null
  /** Distance in meters, when found by position. */
  distance: number | null
}

export interface DirectionOption {
  quayId: string
  quayCode: string | null
  lineId: string
  publicCode: string
  transportMode: TransportMode
  colours: LineColours
  destinations: string[]
}

async function graphql<T>(query: string, variables: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
  const response = await fetch(JOURNEY_PLANNER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'ET-Client-Name': CLIENT_NAME },
    body: JSON.stringify({ query, variables }),
    signal,
  })
  if (!response.ok) throw new Error(`Entur svarte ${response.status}`)
  const body = await response.json()
  if (body.errors?.length) throw new Error(body.errors[0].message)
  return body.data as T
}

/** Maps Entur transport modes to the ones we support. Returns null for the rest. */
export function toTransportMode(mode: string): TransportMode | null {
  if (mode === 'coach') return 'bus'
  return (['bus', 'tram', 'metro', 'rail', 'water'] as string[]).includes(mode) ? (mode as TransportMode) : null
}

// Departures

interface RawCall {
  aimedDepartureTime: string
  expectedDepartureTime: string
  realtime: boolean
  cancellation: boolean
  destinationDisplay: { frontText: string | null } | null
  situations: { summary: { value: string; language: string | null }[] }[]
}

interface RawLine {
  id: string
  presentation: { colour: string | null; textColour: string | null } | null
}

type RawDepartures = Record<string, { id: string; estimatedCalls: RawCall[] } | RawLine | null>

export function buildDeparturesQuery(rows: BoardRow[]): { query: string; variables: Record<string, string> } {
  const params: string[] = []
  const fields: string[] = []
  const variables: Record<string, string> = {}

  rows.forEach((row, i) => {
    params.push(`$q${i}: String!`, `$l${i}: ID!`)
    variables[`q${i}`] = row.quayId
    variables[`l${i}`] = row.lineId
    fields.push(`
  q${i}: quay(id: $q${i}) {
    id
    estimatedCalls(
      numberOfDepartures: ${DEPARTURES_PER_ROW}
      timeRange: 86400
      arrivalDeparture: departures
      includeCancelledTrips: true
      whiteListed: { lines: [$l${i}] }
    ) {
      aimedDepartureTime
      expectedDepartureTime
      realtime
      cancellation
      destinationDisplay { frontText }
      situations { summary { value language } }
    }
  }
  l${i}: line(id: $l${i}) {
    id
    presentation { colour textColour }
  }`)
  })

  return { query: `query (${params.join(', ')}) {${fields.join('')}\n}`, variables }
}

/** Picks the Norwegian text from a multilingual summary, or the first one. */
function norwegian(texts: { value: string; language: string | null }[]): string | null {
  const match = texts.find((t) => t.language && ['no', 'nb', 'nob'].includes(t.language))
  return (match ?? texts[0])?.value ?? null
}

function parseCall(call: RawCall): Departure {
  return {
    aimed: Date.parse(call.aimedDepartureTime),
    expected: Date.parse(call.expectedDepartureTime),
    realtime: call.realtime,
    cancelled: call.cancellation,
    destination: call.destinationDisplay?.frontText ?? '',
    situations: call.situations.map((s) => norwegian(s.summary)).filter((s): s is string => s !== null),
  }
}

export function parseDepartures(rows: BoardRow[], data: RawDepartures): Map<string, RowResult> {
  const results = new Map<string, RowResult>()
  rows.forEach((row, i) => {
    const quay = data[`q${i}`] as { estimatedCalls: RawCall[] } | null
    const line = data[`l${i}`] as RawLine | null
    if (!quay || !line) {
      results.set(row.id, { found: false })
      return
    }
    results.set(row.id, {
      found: true,
      departures: quay.estimatedCalls.map(parseCall),
      colours: {
        colour: line.presentation?.colour ?? null,
        textColour: line.presentation?.textColour ?? null,
      },
    })
  })
  return results
}

export async function fetchDepartures(rows: BoardRow[], signal?: AbortSignal): Promise<Map<string, RowResult>> {
  if (rows.length === 0) return new Map()
  const { query, variables } = buildDeparturesQuery(rows)
  return parseDepartures(rows, await graphql<RawDepartures>(query, variables, signal))
}

// Stops

const NEAREST_QUERY = `query ($latitude: Float!, $longitude: Float!) {
  nearest(
    latitude: $latitude
    longitude: $longitude
    maximumDistance: 1000
    maximumResults: 20
    filterByPlaceTypes: [stopPlace]
    filterByModes: [bus, coach, tram, metro, rail, water]
  ) {
    edges {
      node {
        distance
        place { ... on StopPlace { id name } }
      }
    }
  }
}`

interface RawNearest {
  nearest: { edges: { node: { distance: number; place: { id?: string; name?: string } | null } }[] }
}

export async function fetchNearbyStops(latitude: number, longitude: number): Promise<StopOption[]> {
  const data = await graphql<RawNearest>(NEAREST_QUERY, { latitude, longitude })
  return data.nearest.edges
    .filter(({ node }) => node.place?.id && node.place.name)
    .map(({ node }) => ({
      id: node.place!.id!,
      name: node.place!.name!,
      description: null,
      distance: Math.round(node.distance),
    }))
    .sort((a, b) => a.distance - b.distance)
}

interface RawGeocoderFeature {
  properties: { id: string; name: string; locality?: string; county?: string }
}

export async function searchStops(text: string, signal?: AbortSignal): Promise<StopOption[]> {
  const url = new URL(GEOCODER)
  url.searchParams.set('text', text)
  url.searchParams.set('layers', 'venue')
  url.searchParams.set('size', '10')
  const response = await fetch(url, { headers: { 'ET-Client-Name': CLIENT_NAME }, signal })
  if (!response.ok) throw new Error(`Entur svarte ${response.status}`)
  const body: { features: RawGeocoderFeature[] } = await response.json()
  return body.features
    .filter((f) => f.properties.id.startsWith('NSR:StopPlace:'))
    .map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      description: f.properties.locality ?? f.properties.county ?? null,
      distance: null,
    }))
}

// Directions

const STOP_DIRECTIONS_FRAGMENT = `fragment StopDirections on StopPlace {
  quays {
    id
    publicCode
    estimatedCalls(
      timeRange: 604800
      numberOfDepartures: 200
      numberOfDeparturesPerLineAndDestinationDisplay: 1
      arrivalDeparture: departures
    ) {
      destinationDisplay { frontText }
      serviceJourney {
        line {
          id
          publicCode
          transportMode
          presentation { colour textColour }
        }
      }
    }
  }
}`

/** Builds one query that fetches directions for many stops, with one alias per stop. */
export function buildDirectionsQuery(stopPlaceIds: string[]): { query: string; variables: Record<string, string> } {
  const params = stopPlaceIds.map((_, i) => `$s${i}: String!`)
  const fields = stopPlaceIds.map((_, i) => `  s${i}: stopPlace(id: $s${i}) { ...StopDirections }`)
  const variables = Object.fromEntries(stopPlaceIds.map((id, i) => [`s${i}`, id]))
  return {
    query: `query (${params.join(', ')}) {\n${fields.join('\n')}\n}\n${STOP_DIRECTIONS_FRAGMENT}`,
    variables,
  }
}

interface RawDirectionCall {
  destinationDisplay: { frontText: string | null } | null
  serviceJourney: {
    line: {
      id: string
      publicCode: string | null
      transportMode: string
      presentation: { colour: string | null; textColour: string | null } | null
    }
  }
}

export interface RawStopPlace {
  quays: { id: string; publicCode: string | null; estimatedCalls: RawDirectionCall[] }[]
}

/** Groups upcoming departures into one option per quay and line, with all destinations. */
export function parseDirections(stopPlace: RawStopPlace | null): DirectionOption[] {
  const options = new Map<string, DirectionOption>()

  for (const quay of stopPlace?.quays ?? []) {
    for (const call of quay.estimatedCalls) {
      const line = call.serviceJourney.line
      const transportMode = toTransportMode(line.transportMode)
      if (!transportMode || !line.publicCode) continue

      const key = `${quay.id}|${line.id}`
      let option = options.get(key)
      if (!option) {
        option = {
          quayId: quay.id,
          quayCode: quay.publicCode || null,
          lineId: line.id,
          publicCode: line.publicCode,
          transportMode,
          colours: {
            colour: line.presentation?.colour ?? null,
            textColour: line.presentation?.textColour ?? null,
          },
          destinations: [],
        }
        options.set(key, option)
      }
      const destination = call.destinationDisplay?.frontText
      if (destination && !option.destinations.includes(destination)) {
        option.destinations.push(destination)
      }
    }
  }

  return [...options.values()].sort(
    (a, b) =>
      a.publicCode.localeCompare(b.publicCode, 'nb', { numeric: true }) ||
      a.destinations.join().localeCompare(b.destinations.join(), 'nb'),
  )
}

/** Fetches directions for many stops in one request. Returns options per stop place ID. */
export async function fetchDirections(stopPlaceIds: string[]): Promise<Map<string, DirectionOption[]>> {
  if (stopPlaceIds.length === 0) return new Map()
  const { query, variables } = buildDirectionsQuery(stopPlaceIds)
  const data = await graphql<Record<string, RawStopPlace | null>>(query, variables)
  return new Map(stopPlaceIds.map((id, i) => [id, parseDirections(data[`s${i}`])]))
}
