// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
          clear: 'Suche zurücksetzen',
          label: 'Ich suche gerade nach',
          open: 'Suche wählen',
          other: 'Etwas anderes suchen …',
          pick: 'Wähle, wie Du es meinst — damit wird gesucht.',
          placeholder: 'Fahrrad',
          suggestions: 'Vorschläge',
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

      expect(last(wrapper)).toEqual({ kind: 'typed', text: 'Fahrrad', matchingType: 'gesuch' })
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

  describe('the offers under the field', () => {
    /** A promise a test resolves when it wants to, so two answers can cross. */
    const deferred = () => {
      let settle
      const promise = new Promise((resolve) => {
        settle = resolve
      })
      return { promise, resolve: settle }
    }

    const WORDS = [
      { word: 'rasenluefter', spelling: 'Rasenlüfter', entries: 12 },
      // No sentence ever spelled this one out - the ordinary case for a word a
      // keying model coined rather than read.
      { word: 'rasen', spelling: null, entries: 3 },
    ]

    let wrapper

    /** Attached to the document, because one of these asserts where the cursor is. */
    const mountTyping = async (suggest) => {
      wrapper = mount(MatchQuery, {
        props: { entries, selection: { kind: 'all' }, suggest },
        attachTo: document.body,
        global: {
          plugins: [i18n],
          stubs: ['i-bi-search', 'i-bi-chevron-down', 'i-bi-check', 'i-bi-pencil', 'i-bi-x-lg'],
        },
      })
      await wrapper.find('.query-bar').trigger('click')
      await wrapper.findAll('.query-option').at(-1).trigger('click')
      return wrapper
    }

    /** Type, then let the pause run out and the answer arrive. */
    const type = async (what) => {
      await wrapper.find('.typed-input').setValue(what)
      await vi.advanceTimersByTimeAsync(200)
      await flushPromises()
    }

    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
      wrapper?.unmount()
      wrapper = null
    })

    it('offers what comes back, and asks once per pause rather than once per letter', async () => {
      const suggest = vi.fn(async () => WORDS)
      await mountTyping(suggest)

      // Three letters in one go: the field waits, then asks about what is there.
      await wrapper.find('.typed-input').setValue('r')
      await wrapper.find('.typed-input').setValue('ra')
      await wrapper.find('.typed-input').setValue('ras')

      // Half a keystroke's worth of time is not the pause. Without a wait worth the
      // name this would already have asked - about `r`, and then twice more.
      await vi.advanceTimersByTimeAsync(50)
      expect(suggest).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(200)
      await flushPromises()

      expect(suggest).toHaveBeenCalledTimes(1)
      expect(suggest).toHaveBeenCalledWith('ras')
      // As it reads where a sentence gave the spelling up, as it is stored where
      // none did. The folded form is not a fallback for a failure - it is what the
      // GMS holds, and what was shown before there was anything else.
      expect(wrapper.findAll('.suggestion').map((one) => one.text())).toEqual([
        'Rasenlüfter',
        'rasen',
      ])
      // The list is named for a reader who cannot see it sits under the field.
      expect(wrapper.find('.typed-suggestions').attributes('aria-label')).toBe('Vorschläge')
    })

    it('offers nothing when nothing comes back', async () => {
      await mountTyping(vi.fn(async () => []))
      await type('ras')

      expect(wrapper.find('.typed-suggestions').exists()).toBe(false)
    })

    it('fills the field on a press, leaves the cursor there, and closes the offers', async () => {
      await mountTyping(vi.fn(async () => WORDS))
      await type('ras')

      await wrapper.findAll('.suggestion')[0].trigger('click')

      // What was pressed is what lands in the field. Searching is unaffected: the
      // typed search folds what it is given, so both forms are one question.
      expect(wrapper.find('.typed-input').element.value).toBe('Rasenlüfter')
      // The stances are what ask, so the cursor stays where the sentence is written.
      expect(document.activeElement).toBe(wrapper.find('.typed-input').element)
      expect(wrapper.find('.typed-suggestions').exists()).toBe(false)
      // Nothing was searched for: pressing an offer is still only typing.
      expect(emitted(wrapper)).toHaveLength(0)
    })

    it('puts the offers away once a stance has finished the sentence', async () => {
      await mountTyping(vi.fn(async () => WORDS))
      await type('ras')
      expect(wrapper.findAll('.suggestion')).toHaveLength(2)

      await wrapper.findAll('.stance')[0].trigger('click')

      // The question is asked; what could still have completed it is no longer an
      // offer. This is also what keeps `chosen` and the offers from ever being on
      // screen together, which is why pressing an offer does not touch the stance.
      expect(wrapper.find('.stance').classes()).toContain('is-chosen')
      expect(wrapper.find('.typed-suggestions').exists()).toBe(false)
    })

    it('lets Esc take back the offers first and the field second', async () => {
      await mountTyping(vi.fn(async () => WORDS))
      await type('ras')

      await wrapper.find('.typed-input').trigger('keydown.esc')
      expect(wrapper.find('.typed-suggestions').exists()).toBe(false)
      // Still typing - only the list went.
      expect(wrapper.find('.typed-input').exists()).toBe(true)

      await wrapper.find('.typed-input').trigger('keydown.esc')
      expect(wrapper.find('.typed-input').exists()).toBe(false)
    })

    it('does not let a late answer land on a newer question', async () => {
      const first = deferred()
      const second = deferred()
      const suggest = vi.fn()
      suggest.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
      await mountTyping(suggest)

      await wrapper.find('.typed-input').setValue('ras')
      await vi.advanceTimersByTimeAsync(200)
      await wrapper.find('.typed-input').setValue('rasenlue')
      await vi.advanceTimersByTimeAsync(200)

      // The newer answer arrives first, the older one after it - which is the order
      // that goes wrong, and the one a debounce alone does not prevent.
      second.resolve([{ word: 'rasenluefter', spelling: 'Rasenlüfter', entries: 12 }])
      await flushPromises()
      first.resolve([{ word: 'rasen', spelling: null, entries: 3 }])
      await flushPromises()

      expect(wrapper.findAll('.suggestion').map((one) => one.text())).toEqual(['Rasenlüfter'])
    })
  })
})
