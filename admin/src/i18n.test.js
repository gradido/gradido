import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'

vi.mock('vue-i18n')
vi.mock('./locales/de.json', () => ({ default: { test: 'Test DE' } }))
vi.mock('./locales/en.json', () => ({ default: { test: 'Test EN' } }))

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
      messages: { de, en },
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
