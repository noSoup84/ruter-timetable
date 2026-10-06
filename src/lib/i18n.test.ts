import { describe, expect, it } from 'vitest'
import { pickText, translate } from './i18n'

describe('translate', () => {
  it('returns the text in the chosen language', () => {
    expect(translate('no', 'row.cancelled')).toBe('Innstilt')
    expect(translate('en', 'row.cancelled')).toBe('Cancelled')
  })

  it('fills in placeholders', () => {
    expect(translate('en', 'row.defaultName', { line: '54', destination: 'Kjelsås' })).toBe('54 to Kjelsås')
    expect(translate('no', 'add.addMany', { count: 5 })).toBe('Legg til 5 avganger')
  })

  it('leaves unknown placeholders as they are', () => {
    expect(translate('no', 'add.addMany')).toBe('Legg til {count} avganger')
  })
})

describe('pickText', () => {
  it('picks the chosen language, then Norwegian, then any', () => {
    expect(pickText({ no: 'Buss for trikk', en: 'Tram replacement' }, 'en')).toBe('Tram replacement')
    expect(pickText({ no: 'Buss for trikk' }, 'en')).toBe('Buss for trikk')
    expect(pickText({ en: 'Only English' }, 'no')).toBe('Only English')
    expect(pickText({}, 'no')).toBe('')
  })
})
