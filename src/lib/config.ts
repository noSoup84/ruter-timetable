export type TransportMode = 'bus' | 'tram' | 'metro' | 'rail' | 'water'

export interface BoardRow {
  id: string
  name: string
  transportMode: TransportMode
  lineId: string
  publicCode: string
  quayId: string
  stopName: string
}

export interface AppConfig {
  version: 1
  rows: BoardRow[]
  autoReload: { enabled: boolean; time: string }
  /** Departures up to this many minutes away show as "X m", later ones as clock time. */
  minutesLimit: number
  /** How far away, in meters, stops count as nearby when adding departures. */
  nearbyDistance: number
}

/** Allowed ranges for the number settings. */
export const LIMITS = {
  minutesLimit: { min: 1, max: 120 },
  nearbyDistance: { min: 50, max: 2000 },
} as const

export const STORAGE_KEY = 'ruter-timetable:config'

const TRANSPORT_MODES: TransportMode[] = ['bus', 'tram', 'metro', 'rail', 'water']

export function defaultConfig(): AppConfig {
  return {
    version: 1,
    rows: [],
    autoReload: { enabled: true, time: '04:00' },
    minutesLimit: 30,
    nearbyDistance: 250,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Returns the value if it is a whole number within the limits for the setting, otherwise null. */
export function validSetting(key: keyof typeof LIMITS, value: unknown): number | null {
  const { min, max } = LIMITS[key]
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : null
}

function parseRow(value: unknown): BoardRow | null {
  if (!isRecord(value)) return null
  const { id, name, transportMode, lineId, publicCode, quayId, stopName } = value
  const strings = [id, name, lineId, publicCode, quayId, stopName]
  if (!strings.every((s) => typeof s === 'string')) return null
  if (!TRANSPORT_MODES.includes(transportMode as TransportMode)) return null
  return {
    id: id as string,
    name: name as string,
    transportMode: transportMode as TransportMode,
    lineId: lineId as string,
    publicCode: publicCode as string,
    quayId: quayId as string,
    stopName: stopName as string,
  }
}

/** Validates unknown data as a config. Returns null if it is not a valid version 1 config. */
export function parseConfig(value: unknown): AppConfig | null {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.rows)) return null

  const rows = value.rows.map(parseRow)
  if (rows.some((row) => row === null)) return null

  const defaultSettings = defaultConfig()
  const defaults = defaultSettings.autoReload
  const autoReload = isRecord(value.autoReload) ? value.autoReload : {}
  const enabled = typeof autoReload.enabled === 'boolean' ? autoReload.enabled : defaults.enabled
  const time =
    typeof autoReload.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(autoReload.time)
      ? autoReload.time
      : defaults.time

  return {
    version: 1,
    rows: rows as BoardRow[],
    autoReload: { enabled, time },
    minutesLimit: validSetting('minutesLimit', value.minutesLimit) ?? defaultSettings.minutesLimit,
    nearbyDistance: validSetting('nearbyDistance', value.nearbyDistance) ?? defaultSettings.nearbyDistance,
  }
}

export function loadConfig(storage: Storage = localStorage): AppConfig {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return defaultConfig()
  try {
    return parseConfig(JSON.parse(raw)) ?? defaultConfig()
  } catch {
    return defaultConfig()
  }
}

export function clearConfig(storage: Storage = localStorage): void {
  storage.removeItem(STORAGE_KEY)
}

export function saveConfig(config: AppConfig, storage: Storage = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(config))
}

/** Encodes a config as base64url JSON for use in an import link. */
export function encodeConfig(config: AppConfig): string {
  const bytes = new TextEncoder().encode(JSON.stringify(config))
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeConfig(encoded: string): AppConfig | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    return parseConfig(JSON.parse(new TextDecoder().decode(bytes)))
  } catch {
    return null
  }
}
