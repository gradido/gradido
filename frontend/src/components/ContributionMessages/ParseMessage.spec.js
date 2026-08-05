// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ParseMessage from './ParseMessage.vue'

// What a moderator writes has to arrive as they wrote it. The bold markers are the
// only markup the member's side renders, so this is also the seam where a message --
// which comes from a person -- could otherwise inject HTML.
const render = (message) =>
  mount(ParseMessage, {
    props: { message, type: 'DIALOG' },
    global: {
      stubs: { BLink: true },
      mocks: { $d: (date) => String(date), $filters: { GDD: (value) => value } },
    },
  })

describe('ParseMessage', () => {
  it('renders bold markers as bold', () => {
    expect(render('Vielen **Dank** dafuer').html()).toContain('<strong>Dank</strong>')
  })

  it('renders bold that runs over a line break', () => {
    // The bold shortcut wraps whatever is selected, line breaks included. A dot in the
    // pattern does not match a newline, so such a message used to arrive with its
    // asterisks showing.
    const html = render('**Vielen Dank.\nWir haben ihn bestaetigt.**').html()
    expect(html).toContain('<strong>Vielen Dank.\nWir haben ihn bestaetigt.</strong>')
    expect(html).not.toContain('**')
  })

  it('keeps two bold runs apart instead of swallowing what lies between', () => {
    // The reason the widened pattern is safe: it is still lazy.
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
