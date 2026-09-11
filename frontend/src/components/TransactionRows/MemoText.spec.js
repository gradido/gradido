// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MemoText from './MemoText'

const MARKUP = 'hi <b>there</b> <img src="x" data-probe>'

describe('MemoText', () => {
  // ⛔ A memo is written by somebody else; whatever markup it carries stays text.
  it('shows markup as text and builds no element from it', () => {
    const wrapper = mount(MemoText, { props: { memo: MARKUP } })

    expect(wrapper.find('b').exists()).toBe(false)
    expect(wrapper.find('[data-probe]').exists()).toBe(false)
    expect(wrapper.text()).toBe(MARKUP)
  })

  it('makes a web address a link that opens apart from the wallet', () => {
    const wrapper = mount(MemoText, { props: { memo: 'see https://gradido.net/de/' } })
    const link = wrapper.find('a')

    expect(link.attributes('href')).toBe('https://gradido.net/de/')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.text()).toBe('https://gradido.net/de/')
  })

  it('makes an e-mail address a mail link', () => {
    const wrapper = mount(MemoText, { props: { memo: 'info@gradido.net' } })
    expect(wrapper.find('a').attributes('href')).toBe('mailto:info@gradido.net')
  })

  // The pieces stand side by side with nothing between them -- no space before or after a
  // link that the memo did not have.
  it('adds no space around a link', () => {
    const wrapper = mount(MemoText, { props: { memo: 'see https://x.org.' } })
    expect(wrapper.element.textContent).toBe('see https://x.org.')
  })
})
