// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import GeoSearchField from './GeoSearchField.vue'

const PFARRWEG = {
  lat: 49.2816472,
  lng: 9.7405781,
  label: 'Pfarrweg 2, 74653 Künzelsau',
}
const KUENZELSAU = {
  lat: 49.2803765,
  lng: 9.6901512,
  label: '74653 Künzelsau',
}

// Which service answers is the provider's business (utils/geoSearchProvider) - the field
// only ever sees places.
const search = vi.fn(async () => [PFARRWEG, KUENZELSAU])

const mountField = (props = {}) =>
  mount(GeoSearchField, {
    props: { id: 'field', provider: { search }, ...props },
    attachTo: document.body,
  })

const input = (wrapper) => wrapper.find('#field')
const rows = (wrapper) => wrapper.findAll('.search-result').map((row) => row.text())

const type = async (wrapper, text) => {
  await input(wrapper).setValue(text)
  // The field waits 300 ms after the last key.
  vi.advanceTimersByTime(300)
  await flushPromises()
}

// A question that stays out until the test answers it.
const heldAnswer = () => {
  const held = {}
  search.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        held.answer = resolve
      }),
  )
  return held
}

describe('GeoSearchField', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    search.mockReset()
    search.mockResolvedValue([PFARRWEG, KUENZELSAU])
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('asks the provider once the third letter is there, and shows what comes back', async () => {
    const wrapper = mountField()

    await type(wrapper, 'Pf')
    expect(search).not.toHaveBeenCalled()
    expect(rows(wrapper)).toEqual([])

    await type(wrapper, 'Pfarrweg 2')

    expect(search).toHaveBeenCalledWith({ query: 'Pfarrweg 2' })
    expect(rows(wrapper)).toEqual(['Pfarrweg 2, 74653 Künzelsau', '74653 Künzelsau'])
  })

  // Under fake timers a 0 ms debounce would fire on the same advance as a 300 ms one, so
  // the test has to stand under the threshold first and insist on silence there.
  it('waits the whole 300 ms before it asks', async () => {
    const wrapper = mountField()

    await input(wrapper).setValue('Pfarrweg 2')
    vi.advanceTimersByTime(299)
    await flushPromises()
    expect(search).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await flushPromises()
    expect(search).toHaveBeenCalledTimes(1)
  })

  it('shows the answer to the words typed last, also when an earlier question answers later', async () => {
    const earlier = heldAnswer()
    search.mockResolvedValueOnce([PFARRWEG])
    const wrapper = mountField()

    await type(wrapper, 'Pfar')
    await type(wrapper, 'Pfarrweg 2')
    expect(rows(wrapper)).toEqual(['Pfarrweg 2, 74653 Künzelsau'])

    earlier.answer([KUENZELSAU])
    await flushPromises()

    expect(rows(wrapper)).toEqual(['Pfarrweg 2, 74653 Künzelsau'])
  })

  it('lets a search that was still waiting reopen nothing after a place is picked', async () => {
    const wrapper = mountField()
    await type(wrapper, 'Pfarrweg 2')

    // Typed on, and picked before the field has waited its 300 ms.
    await input(wrapper).setValue('Pfarrweg 2,')
    await wrapper.findAll('.search-result')[0].trigger('mousedown')
    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(rows(wrapper)).toEqual([])
    expect(search).toHaveBeenCalledTimes(1)
  })

  it('lets a search that was still out reopen nothing after the list was closed', async () => {
    const out = heldAnswer()
    const wrapper = mountField()
    await type(wrapper, 'Pfarrweg 2')

    await input(wrapper).trigger('keydown.esc')
    out.answer([PFARRWEG])
    await flushPromises()

    expect(rows(wrapper)).toEqual([])
  })

  it('says nothing and shows nothing when the provider fails', async () => {
    search.mockRejectedValue(new Error('down'))
    const wrapper = mountField()

    await type(wrapper, 'Pfarrweg 2')

    expect(rows(wrapper)).toEqual([])
    expect(wrapper.emitted('pick')).toBeUndefined()
  })

  it('hands up the place that was picked, with its name', async () => {
    const wrapper = mountField()
    await type(wrapper, 'Pfarrweg 2')

    await wrapper.findAll('.search-result')[0].trigger('mousedown')

    expect(wrapper.emitted('pick')).toEqual([[PFARRWEG]])
    expect(input(wrapper).element.value).toBe('')
  })

  // The GMS labels two places the same - "Paris" is France and Texas (measured 13.09.2026).
  // The row itself is handed up, so the second row can never answer with the first place.
  it('hands up the row that was picked, not the first one carrying the same name', async () => {
    const PARIS_FRANCE = { lat: 48.8534951, lng: 2.3483915, label: 'Paris' }
    const PARIS_TEXAS = { lat: 33.6617962, lng: -95.555513, label: 'Paris' }
    search.mockResolvedValue([PARIS_FRANCE, PARIS_TEXAS])
    const wrapper = mountField()
    await type(wrapper, 'Paris')

    await wrapper.findAll('.search-result')[1].trigger('mousedown')

    expect(wrapper.emitted('pick')).toEqual([[PARIS_TEXAS]])
  })

  it('walks the list with the arrow keys and takes the marked row on Enter', async () => {
    const wrapper = mountField()
    await type(wrapper, 'Pfarrweg 2')

    await input(wrapper).trigger('keydown.down')
    await input(wrapper).trigger('keydown.enter')

    expect(wrapper.emitted('pick')).toEqual([[KUENZELSAU]])
  })

  describe('in the list, where it stands open', () => {
    it('shows the field itself and no lens', () => {
      const wrapper = mountField()

      expect(wrapper.find('.gk-search-toggle').exists()).toBe(false)
      expect(input(wrapper).isVisible()).toBe(true)
      // The page beside it carries the visible label, so the field adds no placeholder.
      expect(input(wrapper).attributes('placeholder')).toBeUndefined()
    })

    it('keeps its list open on Escape only until the words are gone', async () => {
      const wrapper = mountField()
      await type(wrapper, 'Pfarrweg 2')

      await input(wrapper).trigger('keydown.esc')

      expect(rows(wrapper)).toEqual([])
      // Nothing to collapse here, so the field stays where it is, words and all.
      expect(input(wrapper).isVisible()).toBe(true)
      expect(input(wrapper).element.value).toBe('Pfarrweg 2')
    })
  })

  describe('on a map, where a lens opens it', () => {
    const lens = (wrapper) => wrapper.find('.gk-search-toggle')

    it('keeps the field away until the lens is tapped, and names both', async () => {
      const wrapper = mountField({ collapsible: true, label: 'Ort oder Adresse suchen' })

      expect(input(wrapper).isVisible()).toBe(false)
      expect(lens(wrapper).attributes('aria-label')).toBe('Ort oder Adresse suchen')
      expect(lens(wrapper).attributes('aria-expanded')).toBe('false')

      await lens(wrapper).trigger('click')

      expect(input(wrapper).isVisible()).toBe(true)
      expect(input(wrapper).attributes('placeholder')).toBe('Ort oder Adresse suchen')
      expect(lens(wrapper).attributes('aria-expanded')).toBe('true')
    })

    it('puts the caret in the field the lens opens', async () => {
      const wrapper = mountField({ collapsible: true })

      await lens(wrapper).trigger('click')
      await flushPromises()

      expect(document.activeElement).toBe(input(wrapper).element)
    })

    it('closes on Escape, words and all', async () => {
      const wrapper = mountField({ collapsible: true })
      await lens(wrapper).trigger('click')
      await type(wrapper, 'Pfarrweg 2')

      await input(wrapper).trigger('keydown.esc')

      expect(input(wrapper).isVisible()).toBe(false)
      expect(input(wrapper).element.value).toBe('')
      expect(rows(wrapper)).toEqual([])
    })

    it('closes when a place is picked', async () => {
      const wrapper = mountField({ collapsible: true })
      await lens(wrapper).trigger('click')
      await type(wrapper, 'Pfarrweg 2')

      await wrapper.findAll('.search-result')[0].trigger('mousedown')

      expect(wrapper.emitted('pick')).toEqual([[PFARRWEG]])
      expect(input(wrapper).isVisible()).toBe(false)
    })

    it('closes again when the lens is tapped a second time', async () => {
      const wrapper = mountField({ collapsible: true })
      await lens(wrapper).trigger('click')
      await type(wrapper, 'Pfarrweg 2')

      await lens(wrapper).trigger('click')

      expect(input(wrapper).isVisible()).toBe(false)
      expect(rows(wrapper)).toEqual([])
    })
  })
})
