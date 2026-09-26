// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { chatTextParts } from './chatTextParts'
import ChatMessageText from '@/components/Chat/ChatMessageText'

describe('chatTextParts', () => {
  it('leaves a message without stars or addresses as one piece of text', () => {
    expect(chatTextParts('Bis Samstag am Stand')).toEqual([
      { type: 'text', value: 'Bis Samstag am Stand' },
    ])
  })

  // E-015: `**…**` is bold, and the stars are the markup, not part of what is shown.
  it('makes a bold run a piece of its own, without its stars', () => {
    expect(chatTextParts('das ist **wichtig** heute')).toEqual([
      { type: 'text', value: 'das ist ' },
      { type: 'bold', value: 'wichtig' },
      { type: 'text', value: ' heute' },
    ])
  })

  it('keeps two bold runs two, rather than one from the first stars to the last', () => {
    expect(chatTextParts('**eins** und **zwei**')).toEqual([
      { type: 'bold', value: 'eins' },
      { type: 'text', value: ' und ' },
      { type: 'bold', value: 'zwei' },
    ])
  })

  // The moderator thread's pattern: a bold run may reach over a line break.
  it('lets a bold run reach over a line break', () => {
    expect(chatTextParts('**Zeile eins\nZeile zwei**')).toEqual([
      { type: 'bold', value: 'Zeile eins\nZeile zwei' },
    ])
  })

  it('leaves web and e-mail addresses what they are in a memo', () => {
    expect(chatTextParts('see https://gradido.net/de/ or write to info@gradido.net')).toEqual([
      { type: 'text', value: 'see ' },
      { type: 'url', value: 'https://gradido.net/de/' },
      { type: 'text', value: ' or write to ' },
      { type: 'email', value: 'info@gradido.net' },
    ])
  })

  /**
   * ⛔ A pair of stars never reaches across a link: bold is looked for only in the plain text
   * BETWEEN addresses. Stars around a link stay stars, and the link stays whole.
   */
  it('cuts cleanly around a link wrapped in stars', () => {
    expect(chatTextParts('**https://gradido.net**')).toEqual([
      { type: 'text', value: '**' },
      { type: 'url', value: 'https://gradido.net' },
      { type: 'text', value: '**' },
    ])
  })

  it('finds bold runs on both sides of a link in the same message', () => {
    expect(chatTextParts('**Wichtig:** siehe https://x.org und **morgen**')).toEqual([
      { type: 'bold', value: 'Wichtig:' },
      { type: 'text', value: ' siehe ' },
      { type: 'url', value: 'https://x.org' },
      { type: 'text', value: ' und ' },
      { type: 'bold', value: 'morgen' },
    ])
  })

  it('leaves a star without its partner a star', () => {
    expect(chatTextParts('2 ** 3')).toEqual([{ type: 'text', value: '2 ** 3' }])
    expect(chatTextParts('**nur links')).toEqual([{ type: 'text', value: '**nur links' }])
    expect(chatTextParts('nur rechts**')).toEqual([{ type: 'text', value: 'nur rechts**' }])
    expect(chatTextParts('****')).toEqual([{ type: 'text', value: '****' }])
  })

  // The text is written by the other side of the conversation: markup in it is text.
  it('keeps markup as text, character for character', () => {
    const text = 'hi <img src=x onerror=alert(1)> <b>there</b>'
    expect(chatTextParts(text)).toEqual([{ type: 'text', value: text }])
  })

  it('has nothing to show for no text', () => {
    expect(chatTextParts('')).toEqual([])
    expect(chatTextParts(undefined)).toEqual([])
  })
})

/**
 * ⛔ The measurement #3884 made for the memo, made again for the chat: MOUNTED, and the DOM
 * read back. A test of the pieces alone cannot see what the component does with them -- a
 * render function that handed the text to `innerHTML` would pass every test above.
 */
describe('ChatMessageText', () => {
  const MARKUP = 'hi <img src=x onerror=alert(1) data-probe> <b>there</b>'

  it('builds no element from markup in the text, and shows it as text', () => {
    const wrapper = mount(ChatMessageText, { props: { text: MARKUP } })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-probe]').exists()).toBe(false)
    expect(wrapper.find('b').exists()).toBe(false)
    expect(wrapper.text()).toBe(MARKUP)
  })

  // Bold is the ONE element the text may ask for -- and what stands inside it is text again.
  it('builds no element from markup inside a bold run either', () => {
    const wrapper = mount(ChatMessageText, {
      props: { text: '**<img src=x onerror=alert(1) data-probe>**' },
    })

    const strong = wrapper.find('strong')
    expect(strong.exists()).toBe(true)
    expect(strong.text()).toBe('<img src=x onerror=alert(1) data-probe>')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('shows a bold run as <strong>, and the stars not at all', () => {
    const wrapper = mount(ChatMessageText, { props: { text: 'das ist **wichtig** heute' } })

    expect(wrapper.find('strong').text()).toBe('wichtig')
    expect(wrapper.element.textContent).toBe('das ist wichtig heute')
  })

  it('makes a web address a link that opens apart from the wallet', () => {
    const wrapper = mount(ChatMessageText, { props: { text: 'see https://gradido.net/de/' } })
    const link = wrapper.find('a')

    expect(link.attributes('href')).toBe('https://gradido.net/de/')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it('makes an e-mail address a mail link', () => {
    const wrapper = mount(ChatMessageText, { props: { text: 'info@gradido.net' } })
    expect(wrapper.find('a').attributes('href')).toBe('mailto:info@gradido.net')
  })

  // The bubble keeps the message's own spaces and line breaks, so the pieces must stand side
  // by side with nothing added between them.
  it('adds nothing between the pieces', () => {
    const wrapper = mount(ChatMessageText, {
      props: { text: 'see https://x.org, **now**.\nthen info@x.org' },
    })
    expect(wrapper.element.textContent).toBe('see https://x.org, now.\nthen info@x.org')
  })
})
