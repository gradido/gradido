// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ParseMessage from './ParseMessage.vue'

// The moderator's own view of the message. It has to agree with what the member sees
// in the wallet -- the two renderers are deliberately the same, so their tests are too.
const render = (message) =>
  mount(ParseMessage, {
    props: { message, messageType: 'DIALOG' },
    global: {
      stubs: { BLink: true },
      mocks: { $d: (date) => String(date), $n: (value) => String(value) },
    },
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
})
