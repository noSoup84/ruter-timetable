import { describe, expect, it } from 'vitest'
import {
  MAX_ROWS,
  MAX_TEXT_LENGTH,
  STORAGE_KEY,
  clearConfig,
  decodeConfig,
  defaultConfig,
  encodeConfig,
  loadConfig,
  parseConfig,
  saveConfig,
  validSetting,
  type AppConfig,
} from './config'

function memoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (i) => [...items.keys()][i] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  }
}

const config: AppConfig = {
  version: 1,
  rows: [
    {
      id: 'a',
      name: '54 mot Kjelsås – æøå',
      transportMode: 'bus',
      lineId: 'RUT:Line:54',
      publicCode: '54',
      quayId: 'NSR:Quay:105467',
      stopName: 'Kværnerbyen',
    },
  ],
  autoReload: { enabled: false, time: '03:30' },
  minutesLimit: 15,
  nearbyDistance: 500,
}

describe('parseConfig', () => {
  it('accepts a valid config', () => {
    expect(parseConfig(config)).toEqual(config)
  })

  it('rejects other versions and broken rows', () => {
    expect(parseConfig({ ...config, version: 2 })).toBeNull()
    expect(parseConfig({ ...config, rows: [{ ...config.rows[0], transportMode: 'air' }] })).toBeNull()
    expect(parseConfig({ ...config, rows: [{ id: 'a' }] })).toBeNull()
    expect(parseConfig('nonsense')).toBeNull()
  })

  it('rejects configs with too many rows or too long text', () => {
    const row = config.rows[0]
    const rows = (count: number) => Array.from({ length: count }, (_, i) => ({ ...row, id: String(i) }))
    expect(parseConfig({ ...config, rows: rows(MAX_ROWS) })).not.toBeNull()
    expect(parseConfig({ ...config, rows: rows(MAX_ROWS + 1) })).toBeNull()
    expect(parseConfig({ ...config, rows: [{ ...row, name: 'x'.repeat(MAX_TEXT_LENGTH) }] })).not.toBeNull()
    expect(parseConfig({ ...config, rows: [{ ...row, name: 'x'.repeat(MAX_TEXT_LENGTH + 1) }] })).toBeNull()
  })

  it('uses defaults for missing or invalid auto reload settings', () => {
    expect(parseConfig({ version: 1, rows: [] })?.autoReload).toEqual(defaultConfig().autoReload)
    expect(parseConfig({ version: 1, rows: [], autoReload: { enabled: true, time: '25:00' } })?.autoReload.time).toBe(
      '04:00',
    )
  })
})

describe('number settings', () => {
  it('uses defaults when missing, so older saved configs still load', () => {
    const parsed = parseConfig({ version: 1, rows: [] })
    expect(parsed?.minutesLimit).toBe(30)
    expect(parsed?.nearbyDistance).toBe(250)
  })

  it('uses defaults for values outside the limits or not whole numbers', () => {
    const parsed = parseConfig({ version: 1, rows: [], minutesLimit: 0, nearbyDistance: 250.5 })
    expect(parsed?.minutesLimit).toBe(30)
    expect(parsed?.nearbyDistance).toBe(250)
  })

  it('validates single values', () => {
    expect(validSetting('minutesLimit', 120)).toBe(120)
    expect(validSetting('minutesLimit', 121)).toBeNull()
    expect(validSetting('nearbyDistance', 50)).toBe(50)
    expect(validSetting('nearbyDistance', Number.NaN)).toBeNull()
  })
})

describe('loadConfig and saveConfig', () => {
  it('returns the default config when nothing is stored', () => {
    expect(loadConfig(memoryStorage())).toEqual(defaultConfig())
  })

  it('returns the default config when stored data is broken', () => {
    const storage = memoryStorage()
    storage.setItem(STORAGE_KEY, '{not json')
    expect(loadConfig(storage)).toEqual(defaultConfig())
  })

  it('returns the default config after clearing', () => {
    const storage = memoryStorage()
    saveConfig(config, storage)
    clearConfig(storage)
    expect(loadConfig(storage)).toEqual(defaultConfig())
  })

  it('reads back what was saved', () => {
    const storage = memoryStorage()
    saveConfig(config, storage)
    expect(loadConfig(storage)).toEqual(config)
  })
})

describe('encodeConfig and decodeConfig', () => {
  it('round trips, including non-ASCII text', () => {
    expect(decodeConfig(encodeConfig(config))).toEqual(config)
  })

  it('produces URL safe text', () => {
    expect(encodeConfig(config)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('returns null for broken input', () => {
    expect(decodeConfig('!!!')).toBeNull()
    expect(decodeConfig(btoa('{"version":1}'))).toBeNull()
  })
})
