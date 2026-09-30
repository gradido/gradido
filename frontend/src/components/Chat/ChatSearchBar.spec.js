// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ChatSearchBar from './ChatSearchBar.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
  }),
}))

const found = (extra = {}) => ({
  searching: true,
  count: 12,
  current: 3,
  busy: false,
  capped: false,
  ...extra,
})

let wrapper
const mountBar = (result, modelValue = 'bank') => {
  wrapper = mount(ChatSearchBar, {
    props: { modelValue, ...(result ? { result } : {}) },
    attachTo: document.body,
    global: { stubs: { IMdiChevronUp: true, IMdiChevronDown: true } },
  })
  return wrapper
}
const field = () => wrapper.find('[data-test="chat-search-field"]')
const count = () => wrapper.find('[data-test="chat-search-count"]').text()
const older = () => wrapper.find('[data-test="chat-search-older"]')
const newer = () => wrapper.find('[data-test="chat-search-newer"]')

describe('ChatSearchBar', () => {
  afterEach(() => {
    wrapper?.unmount()
  })

  // The magnifier opened it: the keyboard goes straight into the field.
  it('takes the keyboard into its field', () => {
    mountBar(found())
    expect(document.activeElement).toBe(field().element)
    expect(field().attributes('aria-label')).toBe('chatSearch.open')
    expect(field().attributes('placeholder')).toBe('chatSearch.placeholder')
  })

  it('hands on what is typed', async () => {
    mountBar(found(), '')
    await field().setValue('Waldrand')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Waldrand']])
  })

  it.each([
    ['nothing while fewer than two letters are typed', { searching: false }, ''],
    ['"Suche …" while older pages come', { busy: true }, 'chatSearch.loading'],
    ['that nothing was found', { count: 0, current: 0 }, 'chatSearch.none'],
    ['which hit of how many', {}, 'chatSearch.count {"current":3,"count":12}'],
  ])('says %s', (what, extra, words) => {
    mountBar(found(extra))
    expect(count()).toBe(words)
  })

  it('says it where a screen reader hears it', () => {
    mountBar(found())
    expect(wrapper.find('[data-test="chat-search-count"]').attributes('aria-live')).toBe('polite')
  })

  // ↑ to the older hit, ↓ to the newer -- named for the ear and the pointer.
  it('steps to the older and the newer hit', async () => {
    mountBar(found())
    expect(older().attributes('aria-label')).toBe('chatSearch.older')
    expect(newer().attributes('aria-label')).toBe('chatSearch.newer')
    await older().trigger('click')
    await newer().trigger('click')
    expect(wrapper.emitted('older')).toHaveLength(1)
    expect(wrapper.emitted('newer')).toHaveLength(1)
  })

  it.each([
    ['at the oldest hit, not to an older one', found({ current: 1 }), 'older'],
    ['at the newest hit, not to a newer one', found({ current: 12 }), 'newer'],
    ['without a hit, to neither', found({ count: 0, current: 0 }), 'both'],
    ['while older pages come, to neither', found({ busy: true }), 'both'],
  ])('does not step %s', async (what, result, which) => {
    mountBar(result)
    const blocked = which === 'both' ? ['older', 'newer'] : [which]
    for (const name of blocked) {
      const button = name === 'older' ? older() : newer()
      expect(button.attributes('aria-disabled')).toBe('true')
      await button.trigger('click')
      expect(wrapper.emitted(name)).toBeUndefined()
    }
  })

  // As in a messenger: Enter to the older hit, Shift+Enter to the newer.
  it('steps with Enter and Shift+Enter', async () => {
    mountBar(found())
    await field().trigger('keydown', { key: 'Enter' })
    await field().trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(wrapper.emitted('older')).toHaveLength(1)
    expect(wrapper.emitted('newer')).toHaveLength(1)
  })

  // Esc closes the search -- and only the search: the window around it must not hear it.
  it('closes on Esc, and the window around it does not hear the key', async () => {
    mountBar(found())
    let heard = 0
    const listener = () => (heard += 1)
    document.body.addEventListener('keydown', listener)
    await field().trigger('keydown', { key: 'Escape' })
    document.body.removeEventListener('keydown', listener)
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(heard).toBe(0)
  })

  it('says where only the newest messages were searched', () => {
    mountBar(found({ capped: true }))
    expect(wrapper.find('[data-test="chat-search-capped"]').text()).toBe(
      'chatSearch.capped {"count":1000}',
    )
    wrapper.unmount()
    mountBar(found())
    expect(wrapper.find('[data-test="chat-search-capped"]').exists()).toBe(false)
  })
})
