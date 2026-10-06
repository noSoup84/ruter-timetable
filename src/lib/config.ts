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
}

export const STORAGE_KEY = 'ruter-timetable:config'

const TRANSPORT_MODES: TransportMode[] = ['bus', 'tram', 'metro', 'rail', 'water']

export function defaultConfig(): AppConfig {
  return { version: 1, rows: [], autoReload: { enabled: true, time: '04:00' } }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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

  const defaults = defaultConfig().autoReload
  const autoReload = isRecord(value.autoReload) ? value.autoReload : {}
  const enabled = typeof autoReload.enabled === 'boolean' ? autoReload.enabled : defaults.enabled
  const time =
    typeof autoReload.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(autoReload.time)
      ? autoReload.time
      : defaults.time

  return { version: 1, rows: rows as BoardRow[], autoReload: { enabled, time } }
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
