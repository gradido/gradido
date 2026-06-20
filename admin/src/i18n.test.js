import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import nl from './locales/nl.json'
import itLocale from './locales/it.json'
import tr from './locales/tr.json'
import ru from './locales/ru.json'
import pt from './locales/pt.json'
import el from './locales/el.json'

vi.mock('vue-i18n')
vi.mock('./locales/de.json', () => ({ default: { test: 'Test DE' } }))
vi.mock('./locales/en.json', () => ({ default: { test: 'Test EN' } }))
vi.mock('./locales/es.json', () => ({ default: { test: 'Test ES' } }))
vi.mock('./locales/fr.json', () => ({ default: { test: 'Test FR' } }))
vi.mock('./locales/nl.json', () => ({ default: { test: 'Test NL' } }))
vi.mock('./locales/it.json', () => ({ default: { test: 'Test IT' } }))
vi.mock('./locales/tr.json', () => ({ default: { test: 'Test TR' } }))
vi.mock('./locales/ru.json', () => ({ default: { test: 'Test RU' } }))
vi.mock('./locales/pt.json', () => ({ default: { test: 'Test PT' } }))
vi.mock('./locales/el.json', () => ({ default: { test: 'Test EL' } }))

describe('i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('creates i18n instance with correct configuration', async () => {
    const mockCreateI18n = vi.mocked(createI18n)
    mockCreateI18n.mockReturnValue({
      global: {
        locale: 'en',
        fallbackLocale: 'en',
        t: vi.fn(),
        d: vi.fn(),
        n: vi.fn(),
      },
    })

    const i18n = (await import('./i18n')).default

    expect(mockCreateI18n).toHaveBeenCalledWith({
      locale: 'en',
      legacy: false,
      fallbackLocale: 'en',
      messages: { de, en, es, fr, nl, it: itLocale, tr, ru, pt, el },
      numberFormats: expect.any(Object),
      datetimeFormats: expect.any(Object),
    })

    expect(i18n.global.t).toBeDefined()
    expect(i18n.global.d).toBeDefined()
    expect(i18n.global.n).toBeDefined()
  })

  it('configures number formats correctly', async () => {
    const mockCreateI18n = vi.mocked(createI18n)
    await import('./i18n')

    const callArg = mockCreateI18n.mock.calls[0][0]
    expect(callArg.numberFormats).toEqual(
      expect.objectContaining({
        en: expect.objectContaining({
          decimal: expect.any(Object),
          ungroupedDecimal: expect.any(Object),
        }),
        de: expect.objectContaining({
          decimal: expect.any(Object),
          ungroupedDecimal: expect.any(Object),
        }),
      }),
    )
  })

  it('configures datetime formats correctly', async () => {
    const mockCreateI18n = vi.mocked(createI18n)
    await import('./i18n')

    const callArg = mockCreateI18n.mock.calls[0][0]
    expect(callArg.datetimeFormats).toEqual(
      expect.objectContaining({
        en: expect.objectContaining({
          short: expect.any(Object),
          long: expect.any(Object),
          monthShort: expect.any(Object),
          month: expect.any(Object),
          year: expect.any(Object),
        }),
        de: expect.objectContaining({
          short: expect.any(Object),
          long: expect.any(Object),
          monthShort: expect.any(Object),
          month: expect.any(Object),
          year: expect.any(Object),
        }),
      }),
    )
  })
})
