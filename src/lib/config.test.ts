import { describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  clearConfig,
  decodeConfig,
  defaultConfig,
  encodeConfig,
  loadConfig,
  parseConfig,
  saveConfig,
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

  it('uses defaults for missing or invalid auto reload settings', () => {
    expect(parseConfig({ version: 1, rows: [] })?.autoReload).toEqual(defaultConfig().autoReload)
    expect(parseConfig({ version: 1, rows: [], autoReload: { enabled: true, time: '25:00' } })?.autoReload.time).toBe(
      '04:00',
    )
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
