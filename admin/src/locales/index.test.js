import { describe, it, expect, beforeEach } from 'vitest'
import locales from './index.js'

describe('locales', () => {
  let localeCopy

  beforeEach(() => {
    localeCopy = [...locales] // Create a copy to avoid modifying the original
  })

  it('should contain exactly 2 locales', () => {
    expect(localeCopy).toHaveLength(2)
  })

  it('should contain a German locale', () => {
    const germanLocale = localeCopy.find((locale) => locale.code === 'de')
    expect(germanLocale).toEqual(
      expect.objectContaining({
        name: 'Deutsch',
        code: 'de',
        iso: 'de-DE',
        enabled: true,
      }),
    )
  })

  it('should contain an English locale', () => {
    const englishLocale = localeCopy.find((locale) => locale.code === 'en')
    expect(englishLocale).toEqual(
      expect.objectContaining({
        name: 'English',
        code: 'en',
        iso: 'en-US',
        enabled: true,
      }),
    )
  })

  it('should have unique code and iso values for each locale', () => {
    const codes = localeCopy.map((locale) => locale.code)
    const isos = localeCopy.map((locale) => locale.iso)
    expect(new Set(codes).size).toBe(localeCopy.length)
    expect(new Set(isos).size).toBe(localeCopy.length)
  })

  it('should have all locales enabled', () => {
    expect(localeCopy.every((locale) => locale.enabled)).toBe(true)
  })

  it('should have valid ISO codes', () => {
    const isoRegex = /^[a-z]{2}-[A-Z]{2}$/
    expect(localeCopy.every((locale) => isoRegex.test(locale.iso))).toBe(true)
  })

  it('should have matching language codes in code and iso properties', () => {
    localeCopy.forEach((locale) => {
      expect(locale.code).toBe(locale.iso.split('-')[0])
    })
  })

  it('should have name property as a non-empty string', () => {
    localeCopy.forEach((locale) => {
      expect(typeof locale.name).toBe('string')
      expect(locale.name.length).toBeGreaterThan(0)
    })
  })

  it('should not have any additional unexpected properties', () => {
    const expectedProps = ['name', 'code', 'iso', 'enabled']
    localeCopy.forEach((locale) => {
      const localeProps = Object.keys(locale)
      expect(localeProps).toEqual(expect.arrayContaining(expectedProps))
      expect(localeProps.length).toBe(expectedProps.length)
    })
  })
})
