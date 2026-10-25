// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ParseMessage } from './ParseMessage'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ d: (date) => `D(${date.toISOString()})`, n: (value) => `N(${value})` }),
}))

// The moderator's own view of the message. It has to agree with what the member sees
// in the wallet -- the two renderers are deliberately the same, so their tests are too.
const render = (message, type = 'DIALOG') =>
  mount(ParseMessage, {
    props: { message, type },
  })

describe('ParseMessage', () => {
  it('renders bold markers as bold', () => {
    expect(render('Vielen **Dank** dafuer').html()).toContain('<strong>Dank</strong>')
  })

  it('renders bold that runs over a line break', () => {
    // The bold shortcut wraps whatever is selected, line breaks included. A dot in the
    // pattern does not match a newline, so such a message used to show its asterisks.
    const html = render('**Vielen Dank.\nWir haben ihn bestaetigt.**').html()
    expect(html).toContain('<strong>Vielen Dank.\nWir haben ihn bestaetigt.</strong>')
    expect(html).not.toContain('**')
  })

  it('keeps two bold runs apart instead of swallowing what lies between', () => {
    const html = render('Hallo **Anna**,\n\nviele Gruesse\n**Das Team**').html()
    // Read out what each bold run actually contains. Asking the whole document
    // whether it holds "<strong> ... greeting ... </strong>" would be answered by
    // the span between the FIRST opening and the LAST closing tag, and pass on
    // broken output too.
    const bolded = [...html.matchAll(/<strong>([\s\S]*?)<\/strong>/g)].map((match) => match[1])
    expect(bolded).toEqual(['Anna', 'Das Team'])
  })

  it('escapes markup in the message instead of rendering it', () => {
    const html = render('<img src=x onerror=alert(1)> and **bold**').html()
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('turns a link into an anchor that opens in a new tab', () => {
    const anchor = render('see https://gradido.net/de here').find('a')
    expect(anchor.attributes('href')).toBe('https://gradido.net/de')
    expect(anchor.attributes('target')).toBe('_blank')
    expect(anchor.text()).toBe('https://gradido.net/de')
  })

  it('shows a history entry as its date, the text and the amount', () => {
    const wrapper = render('2024-01-02T03:04:05.000Z\n---\nOld memo\n---\n100', 'HISTORY')
    const spans = wrapper
      .findAll('span')
      .filter((span) => span.element.parentElement === wrapper.element)
    expect(spans.map((span) => span.text())).toEqual([
      'D(2024-01-02T03:04:05.000Z)',
      'Old memo',
      'N(100) GDD',
    ])
    // The line break follows the date and comes before the amount, a space beside each
    const nodes = (span) =>
      [...span.find('span').element.childNodes].map((node) => node.nodeName + node.textContent)
    expect(nodes(spans[0])).toEqual(['#textD(2024-01-02T03:04:05.000Z) ', 'BR'])
    expect(nodes(spans[2])).toEqual(['BR', '#text N(100) GDD'])
  })
})
