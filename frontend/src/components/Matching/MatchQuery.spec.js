// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { createI18n } from 'vue-i18n'
import MatchQuery from './MatchQuery.vue'
import { LABEL_COLORS } from './displayCore'

const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      matching: {
        query: {
          all: 'Alle meine Einträge',
          details: 'Näheres zu Deiner Suche',
          detailsPlaceholder: 'gebraucht, 28 Zoll',
          clear: 'Suche zurücksetzen',
          label: 'Ich suche gerade nach',
          open: 'Suche wählen',
          other: 'Etwas anderes suchen …',
          pick: 'Wähle, wie Du es meinst — damit wird gesucht.',
          placeholder: 'Fahrrad',
          untouched: 'Deine Einträge bleiben unberührt.',
        },
        type: {
          interesse: { prefix: 'Ich liebe' },
          angebot: { prefix: 'Ich biete' },
          gesuch: { prefix: 'Ich suche' },
        },
      },
    },
  },
})

/**
 * The SERVER's words, because that is what a stored entry carries.
 *
 * This fixture used to say 'gesuch' and 'angebot' — display words that no entry
 * coming out of `listMatchingEntries` ever holds. A fixture that does not look like
 * the real thing cannot fail on the real thing: the component read the server word
 * straight into a locale key and a colour table, and every one of these tests stayed
 * green while a member saw `matching.type.need.prefix` and three red dots.
 */
const entries = [
  { uuid: 'e1', matchingType: 'need', summary: 'einen Klavierlehrer' },
  { uuid: 'e2', matchingType: 'offer', summary: 'Gartenarbeit' },
]

/** jsdom normalises an inline hex colour to its rgb() form. */
const asRgb = (hex) => {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16))
  return `rgb(${r}, ${g}, ${b})`
}

const mountQuery = (selection = { kind: 'all' }) =>
  mount(MatchQuery, {
    props: { entries, selection },
    global: {
      plugins: [i18n],
      stubs: ['i-bi-search', 'i-bi-chevron-down', 'i-bi-check', 'i-bi-pencil', 'i-bi-x-lg'],
    },
  })

const emitted = (wrapper) => wrapper.emitted('update:selection') ?? []
const last = (wrapper) => emitted(wrapper).at(-1)?.[0]

describe('MatchQuery', () => {
  describe('the closed bar', () => {
    it('says what is being searched for', () => {
      expect(mountQuery().text()).toContain('Alle meine Einträge')
    })

    it('names the entry when one of mine is the question', () => {
      const wrapper = mountQuery({ kind: 'entry', uuid: 'e1' })

      expect(wrapper.text()).toContain('Ich suche einen Klavierlehrer')
    })

    it('shows the words themselves when the question was typed', () => {
      const wrapper = mountQuery({ kind: 'typed', text: 'Fahrrad', matchingType: 'gesuch' })

      expect(wrapper.text()).toContain('Fahrrad')
    })
  })

  describe('the menu', () => {
    it('offers everything, each of my entries, and something else', async () => {
      const wrapper = mountQuery()
      await wrapper.find('.query-bar').trigger('click')

      const options = wrapper.findAll('.query-option').map((o) => o.text())

      expect(options).toHaveLength(4)
      expect(options[0]).toContain('Alle meine Einträge')
      expect(options[1]).toContain('Ich suche einen Klavierlehrer')
      expect(options[2]).toContain('Ich biete Gartenarbeit')
      expect(options[3]).toContain('Etwas anderes')
    })

    it('reads a stored entry in the wallet is own words, never as a raw key', async () => {
      // The server says `need`; the locale block and the colour table are keyed by
      // `gesuch`. Skip the translation and both fail silently — the key renders as
      // itself, and the colour falls through to its default.
      const wrapper = mountQuery()
      await wrapper.find('.query-bar').trigger('click')

      expect(wrapper.text()).not.toContain('matching.type')
    })

    it('gives each entry the colour of its own channel', async () => {
      const wrapper = mountQuery()
      await wrapper.find('.query-bar').trigger('click')

      const dots = wrapper.findAll('.option-dot').map((d) => d.attributes('style'))

      expect(dots[0]).toContain(asRgb(LABEL_COLORS.gesuch))
      expect(dots[1]).toContain(asRgb(LABEL_COLORS.angebot))
    })

    it('asks straight away when the question is one of my entries', async () => {
      // No trigger needed here: a stored entry is already a finished sentence.
      const wrapper = mountQuery()
      await wrapper.find('.query-bar').trigger('click')
      await wrapper.findAll('.query-option')[1].trigger('click')

      expect(last(wrapper)).toEqual({ kind: 'entry', uuid: 'e1' })
    })
  })

  describe('typing a question', () => {
    const startTyping = async (wrapper) => {
      await wrapper.find('.query-bar').trigger('click')
      await wrapper.findAll('.query-option').at(-1).trigger('click')
    }

    it('does not search while the words are still being typed', async () => {
      // The whole point of the trigger rule: typing is free, asking is deliberate.
      const wrapper = mountQuery()
      await startTyping(wrapper)
      await wrapper.find('.typed-input').setValue('Fahrrad')

      expect(emitted(wrapper)).toHaveLength(0)
    })

    it('asks when a stance finishes the sentence', async () => {
      const wrapper = mountQuery()
      await startTyping(wrapper)
      await wrapper.find('.typed-input').setValue('Fahrrad')
      await wrapper.findAll('.stance')[2].trigger('click')

      expect(last(wrapper)).toEqual({
        kind: 'typed',
        text: 'Fahrrad',
        details: '',
        matchingType: 'gesuch',
      })
    })

    it('carries the particulars along with the question', async () => {
      // They are what lifts a hit from "same word" to "same thing", so they have to
      // reach the search - and, later, the entry the search can become.
      const wrapper = mountQuery()
      await startTyping(wrapper)
      const fields = wrapper.findAll('.typed-input')
      await fields[0].setValue('Fahrrad')
      await fields[1].setValue('  gebraucht, 28 Zoll  ')
      await wrapper.findAll('.stance')[2].trigger('click')

      expect(last(wrapper).details).toBe('gebraucht, 28 Zoll')
    })

    it('takes the stance back when only the particulars change', async () => {
      // Same rule as for the summary, and for the same reason: the particulars narrow
      // the very same question, so changing them unmakes the sentence that was asked.
      const wrapper = mountQuery()
      await startTyping(wrapper)
      const fields = wrapper.findAll('.typed-input')
      await fields[0].setValue('Fahrrad')
      await wrapper.findAll('.stance')[2].trigger('click')

      expect(wrapper.find('.stance.is-chosen').exists()).toBe(true)

      await fields[1].setValue('nur Damenrad')

      expect(wrapper.find('.stance.is-chosen').exists()).toBe(false)
    })

    it('asks on the summary alone - the particulars are an offer, not a toll', async () => {
      const wrapper = mountQuery()
      await startTyping(wrapper)
      await wrapper.findAll('.typed-input')[0].setValue('Fahrrad')

      expect(wrapper.findAll('.stance').every((s) => s.attributes('disabled') === undefined)).toBe(
        true,
      )
    })

    it('keeps the stances inert while there is nothing to complete', async () => {
      const wrapper = mountQuery()
      await startTyping(wrapper)

      expect(wrapper.findAll('.stance').every((s) => s.attributes('disabled') !== undefined)).toBe(
        true,
      )

      await wrapper.find('.typed-input').setValue('Fahrrad')

      expect(wrapper.findAll('.stance').every((s) => s.attributes('disabled') === undefined)).toBe(
        true,
      )
    })

    it('takes the stance back when the words change', async () => {
      // Otherwise the list below would still hold answers to a sentence that no
      // longer exists. Letting the choice fall keeps one rule: what you see belongs
      // to the sentence you finished.
      const wrapper = mountQuery()
      await startTyping(wrapper)
      await wrapper.find('.typed-input').setValue('Fahrrad')
      await wrapper.findAll('.stance')[2].trigger('click')

      expect(wrapper.find('.stance.is-chosen').exists()).toBe(true)

      await wrapper.find('.typed-input').setValue('Lastenrad')

      expect(wrapper.find('.stance.is-chosen').exists()).toBe(false)
    })

    it('trims the words before asking', async () => {
      const wrapper = mountQuery()
      await startTyping(wrapper)
      await wrapper.find('.typed-input').setValue('  Fahrrad  ')
      await wrapper.findAll('.stance')[2].trigger('click')

      expect(last(wrapper).text).toBe('Fahrrad')
    })

    it('offers the three stances in the wallet is own words', async () => {
      const wrapper = mountQuery()
      await startTyping(wrapper)

      expect(wrapper.findAll('.stance').map((s) => s.text())).toEqual([
        'Ich liebe',
        'Ich biete',
        'Ich suche',
      ])
    })

    it('goes back to everything when the search is cleared', async () => {
      const wrapper = mountQuery()
      await startTyping(wrapper)
      await wrapper.find('.typed-input').setValue('Fahrrad')
      await wrapper.find('.typed-clear').trigger('click')

      expect(last(wrapper)).toEqual({ kind: 'all' })
      expect(wrapper.find('.typed-input').exists()).toBe(false)
    })
  })
})
