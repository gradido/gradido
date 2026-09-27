// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import de from '@/locales/de.json'
import en from '@/locales/en.json'
import { useAppToast } from './useToast'

const mockShow = vi.fn()
vi.mock('bootstrap-vue-next', () => ({
  useToastController: () => ({ show: mockShow }),
}))

// The real locale files, not a stand-in for t(): what is measured here is the word a person
// reads, and a stubbed t() would hand back any key it is given.
const toastIn = (locale) => {
  const i18n = createI18n({ legacy: false, locale, messages: { de, en } })
  let toast
  const Probe = {
    template: '<div />',
    setup() {
      toast = useAppToast()
      return {}
    },
  }
  mount(Probe, { global: { plugins: [i18n] } })
  return toast
}
const title = () => mockShow.mock.calls.at(-1)[0].props.title

beforeEach(() => {
  mockShow.mockClear()
})

describe('useAppToast', () => {
  // `error` is a group of messages in the wallet's locale files, so t('error') answered with
  // its own name: every red toast was titled "error", in every language.
  it.each([
    ['de', 'Achtung!'],
    ['en', 'Attention!'],
  ])('titles a red toast in %s with a word, not the name of a key', (locale, word) => {
    toastIn(locale).toastError('Something went wrong.')

    expect(title()).toBe(word)
    expect(mockShow.mock.calls.at(-1)[0].props.variant).toBe('danger')
  })

  it('keeps the other two titles as they were', () => {
    const toast = toastIn('de')

    toast.toastSuccess('Gespeichert.')
    expect(title()).toBe(de.success)
    toast.toastInfo('Hinweis.')
    expect(title()).toBe(de.info)
  })
})
