// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ref } from 'vue'
import ChatMessageText from './ChatMessageText'
import { CHAT_SEARCH } from '@/utils/chatSearch'
import { CHAT_VIDEO_JOIN } from '@/utils/chatVideoApp'

// The card and the copy button have specs of their own; here they are marks where they stand.
vi.mock('@/components/Chat/ChatFileCard.vue', async () => {
  const { h: make } = await import('vue')
  return {
    default: {
      name: 'ChatFileCard',
      props: ['href', 'service'],
      render() {
        return make('i', { 'data-test': 'file-card', 'data-href': this.href })
      },
    },
  }
})
vi.mock('@/components/Chat/ChatVideoLinkCopy.vue', async () => {
  const { h: make } = await import('vue')
  return {
    default: {
      name: 'ChatVideoLinkCopy',
      props: ['href'],
      render() {
        return make('i', { 'data-test': 'video-copy', 'data-href': this.href })
      },
    },
  }
})

describe('ChatMessageText', () => {
  let wrapper

  const show = (text, { needle = '', join = null } = {}) => {
    wrapper = mount(ChatMessageText, {
      props: { text },
      global: {
        provide: { [CHAT_SEARCH]: ref(needle), ...(join ? { [CHAT_VIDEO_JOIN]: join } : {}) },
      },
    })
    return wrapper
  }
  const root = () => wrapper.element
  const html = () => root().innerHTML

  afterEach(() => wrapper?.unmount())

  /**
   * ⛔ A message that is no Markdown is what it always was: one `<span>` with its words in it,
   * its line breaks as typed (the bubble's `pre-wrap` shows them), bold runs and addresses.
   */
  describe('a message that is no Markdown', () => {
    it('is one span with the words as they were typed', () => {
      show('Wir treffen uns am\n12. Oktober um 19 Uhr.\n\nBis dann!\n- Bernd')
      expect(root().tagName).toBe('SPAN')
      expect(root().className).toBe('chat-message-text')
      expect(root().children).toHaveLength(0)
      expect(root().textContent).toBe(
        'Wir treffen uns am\n12. Oktober um 19 Uhr.\n\nBis dann!\n- Bernd',
      )
    })

    it('has its bold runs and its addresses, as before', () => {
      show('Das ist **wichtig**: https://gradido.net/de/ oder anna@example.org')
      expect(html()).toBe(
        'Das ist <strong>wichtig</strong>: ' +
          '<a href="https://gradido.net/de/" target="_blank" rel="noopener noreferrer">https://gradido.net/de/</a>' +
          ' oder <a href="mailto:anna@example.org">anna@example.org</a>',
      )
    })

    it('shows nothing for no text', () => {
      show('')
      expect(root().tagName).toBe('SPAN')
      expect(html()).toBe('')
    })
  })

  describe('a message that is Markdown', () => {
    it('is a block that holds its parts in their order', () => {
      show('# Titel\n\nText\n\n- a\n- b')
      expect(root().tagName).toBe('DIV')
      expect(root().className).toBe('chat-message-text chat-md')
      expect([...root().children].map((part) => part.tagName)).toEqual(['H4', 'DIV', 'UL'])
    })

    // The thread's own headings: a day's date is an h3, so a message's begin under it.
    it.each([
      [1, 'H4'],
      [2, 'H5'],
      [3, 'H6'],
      [4, 'H6'],
      [5, 'H6'],
      [6, 'H6'],
    ])('makes a heading of level %i an %s, with its level as a class', (level, tag) => {
      show(`${'#'.repeat(level)} Titel mit **Fett**`)
      const heading = root().firstElementChild
      expect(heading.tagName).toBe(tag)
      expect(heading.className).toBe(`chat-md-heading chat-md-heading-${level}`)
      expect(heading.innerHTML).toBe('Titel mit <strong>Fett</strong>')
    })

    it('shows emphasis, struck text and code in a line', () => {
      show('# x\n\n*kursiv* __fett__ ~~weg~~ `code` ***beides***')
      expect(root().children[1].innerHTML).toBe(
        '<em>kursiv</em> <strong>fett</strong> <s>weg</s> ' +
          '<code class="chat-md-code">code</code> <strong><em>beides</em></strong>',
      )
    })

    it('shows code between fences as it stands', () => {
      show('```\nconst a = **b**\n  <i>kein Markup</i>\n```')
      const pre = root().firstElementChild
      expect(pre.tagName).toBe('PRE')
      expect(pre.className).toBe('chat-md-pre')
      expect(pre.children).toHaveLength(1)
      expect(pre.firstElementChild.tagName).toBe('CODE')
      expect(pre.textContent).toBe('const a = **b**\n  <i>kein Markup</i>')
      expect(pre.querySelector('i')).toBeNull()
    })

    // Mostly the name of the code's language; where somebody wrote words there, they are shown too.
    it('shows what stood behind the opening fence over the code', () => {
      show('```bash\nls -la\n```')
      const pre = root().firstElementChild
      expect([...pre.children].map((part) => `${part.tagName}.${part.className}`)).toEqual([
        'SPAN.chat-md-pre-lang',
        'CODE.',
      ])
      expect(pre.firstElementChild.textContent).toBe('bash')
      expect(pre.lastElementChild.textContent).toBe('ls -la')
      show('``` <b>hier</b> ein Beispiel\nls\n```')
      expect(root().querySelector('.chat-md-pre-lang').textContent).toBe('<b>hier</b> ein Beispiel')
      expect(root().querySelector('b')).toBeNull()
    })

    it('shows a quotation with what it holds, and a rule', () => {
      show('> **eins**\n> zwei\n\n---')
      const [quote, rule] = root().children
      expect(quote.tagName).toBe('BLOCKQUOTE')
      expect(quote.className).toBe('chat-md-quote')
      expect(quote.firstElementChild.innerHTML).toBe('<strong>eins</strong>\nzwei')
      expect(rule.tagName).toBe('HR')
      expect(rule.className).toBe('chat-md-rule')
    })

    describe('a list', () => {
      it('of points has its entries, each with its words in the entry itself', () => {
        show('- eins\n- **zwei**')
        const list = root().firstElementChild
        expect(list.tagName).toBe('UL')
        expect(list.className).toBe('chat-md-list')
        expect([...list.children].map((entry) => entry.innerHTML)).toEqual([
          'eins',
          '<strong>zwei</strong>',
        ])
      })

      // ⛔ "3." stays the third: the browser would number a list from 1 on its own.
      it('of numbers carries each number as it was typed', () => {
        show('3. drei\n4. vier\n9. neun')
        const list = root().firstElementChild
        expect(list.tagName).toBe('OL')
        expect([...list.children].map((entry) => entry.getAttribute('value'))).toEqual([
          '3',
          '4',
          '9',
        ])
      })

      // An entry may begin with code, a quotation or a list of its own: shown, not dropped.
      it('shows an entry that begins with something other than words', () => {
        show('- ```\n  npm i\n  ```\n- > zitiert\n- zwei')
        const [first, second, third] = root().firstElementChild.children
        expect(first.firstElementChild.tagName).toBe('PRE')
        expect(first.textContent).toBe('npm i')
        expect(second.firstElementChild.tagName).toBe('BLOCKQUOTE')
        expect(second.textContent).toBe('zitiert')
        expect(third.textContent).toBe('zwei')
      })

      it('holds a list in an entry, under the entry’s words', () => {
        show('- oben\n  - innen\n- unten')
        const [first] = root().firstElementChild.children
        expect(first.childNodes[0].textContent).toBe('oben')
        expect(first.children[0].tagName).toBe('UL')
        expect(first.children[0].textContent).toBe('innen')
      })

      /**
       * A box as the browser draws one -- a screen reader says "ticked" or "not ticked" in the
       * reader's own language, which a sign (☑) would not --, and for nobody to tick: the message
       * is somebody's words, not a form. Out of use for the ear and out of the keyboard's way,
       * but not `disabled`, which draws a ticked box as pale as an empty one.
       */
      it('shows a box to tick as a box nobody can tick, ticked or not, and no point before it', async () => {
        show('- [x] fertig\n- [ ] offen\n- ohne')
        const [done, open, plain] = root().firstElementChild.children
        expect(done.className).toBe('chat-md-task')
        const box = (entry) => entry.querySelector('input.chat-md-box[type="checkbox"]')
        expect(box(done).checked).toBe(true)
        expect(box(open).checked).toBe(false)
        for (const entry of [done, open]) {
          expect(box(entry).disabled).toBe(false)
          expect(box(entry).getAttribute('aria-disabled')).toBe('true')
          expect(box(entry).getAttribute('tabindex')).toBe('-1')
        }
        // A press that reaches it all the same changes nothing.
        box(open).click()
        box(done).click()
        await wrapper.vm.$nextTick()
        expect(box(open).checked).toBe(false)
        expect(box(done).checked).toBe(true)
        expect(done.textContent).toBe('fertig')
        expect(open.textContent).toBe('offen')
        expect(plain.className).toBe('')
        expect(box(plain)).toBeNull()
        expect(plain.textContent).toBe('ohne')
      })
    })

    describe('a table', () => {
      const TABLE =
        '| Name | Betrag | Mitte |\n|:-----|-------:|:-----:|\n| **Anna** | 20 | x |\n| Bernd | 100 |'

      it('has its head and its rows, an empty cell where a row is short', () => {
        show(TABLE)
        const table = root().querySelector('table.chat-md-table')
        expect([...table.querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual([
          'Name',
          'Betrag',
          'Mitte',
        ])
        // Each head says it heads a column: a screen reader names it with every cell under it.
        expect(
          [...table.querySelectorAll('thead th')].map((cell) => cell.getAttribute('scope')),
        ).toEqual(['col', 'col', 'col'])
        expect(table.querySelector('tbody th')).toBeNull()
        expect(
          [...table.querySelectorAll('tbody tr')].map((row) =>
            [...row.children].map((cell) => cell.innerHTML),
          ),
        ).toEqual([
          ['<strong>Anna</strong>', '20', 'x'],
          ['Bernd', '100', ''],
        ])
      })

      it('sets each column as its line of dashes says', () => {
        show(TABLE)
        const classes = (row) => [...row.children].map((cell) => cell.className)
        expect(classes(root().querySelector('thead tr'))).toEqual([
          'chat-md-cell-left',
          'chat-md-cell-right',
          'chat-md-cell-center',
        ])
        expect(classes(root().querySelector('tbody tr'))).toEqual([
          'chat-md-cell-left',
          'chat-md-cell-right',
          'chat-md-cell-center',
        ])
      })

      // The table scrolls sideways where it is wider than the bubble: the keyboard has to get in.
      it('stands in a box the keyboard reaches', () => {
        show(TABLE)
        const box = root().firstElementChild
        expect(box.className).toBe('chat-md-table-box')
        expect(box.getAttribute('tabindex')).toBe('0')
        expect(box.firstElementChild.tagName).toBe('TABLE')
      })
    })
  })

  /**
   * ⛔ The text is the other side's. A link with words leads only where a link may lead, opens in
   * a tab of its own without handing the wallet over, and says where it leads -- the words are
   * the other side's too.
   */
  describe('a link with words', () => {
    it('is a link to its address, in a tab of its own', () => {
      show('siehe [die Seite](https://gradido.net/de/)')
      const link = root().querySelector('a')
      expect(link.getAttribute('href')).toBe('https://gradido.net/de/')
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
      expect(link.textContent).toBe('die Seite')
    })

    it('says where it leads, behind the words and not as part of the link', () => {
      show('siehe [die Seite](https://gradido.net/de/) dazu')
      expect(root().textContent).toBe('siehe die Seite (gradido.net) dazu')
      const where = root().querySelector('.chat-md-link-where')
      expect(where.textContent).toBe(' (gradido.net)')
      expect(where.closest('a')).toBeNull()
    })

    // The oldest trick: words that look like one address over another.
    it('says where it leads when the words name another address', () => {
      show('[https://meine-bank.example](https://ganz-woanders.example/login)')
      expect(root().textContent).toBe('https://meine-bank.example (ganz-woanders.example)')
    })

    it('does not say it twice where the words name the host', () => {
      show('[gradido.net – die Akademie](https://gradido.net/de/)')
      expect(root().querySelector('.chat-md-link-where')).toBeNull()
      expect(root().textContent).toBe('gradido.net – die Akademie')
    })

    it('does not say it twice where the words are the address, or name the host in a sentence', () => {
      for (const words of [
        'https://gradido.net/de/',
        'Siehe gradido.net.',
        'GRADIDO.NET',
        'auf (gradido.net)',
      ]) {
        show(`[${words}](https://gradido.net/de/)`)
        expect(root().querySelector('.chat-md-link-where'), words).toBeNull()
      }
    })

    // ⛔ Named means named as a word of its own: a part of a longer name is another place.
    it.each([
      ['bank.example', 'https://ank.example/', 'ank.example'],
      ['bank.example', 'https://bank.example.anderswo.example/', 'bank.example.anderswo.example'],
      [
        'https://bank.example/konto',
        'https://bank.example@anderswo.example/konto',
        'anderswo.example',
      ],
      [
        'www.bank.example',
        'https://bank.example.evil.example/www.bank.example',
        'bank.example.evil.example',
      ],
      ['meine-bank.example', 'https://bank.example/', 'bank.example'],
      // The second reader's: a short host that is part of a longer name, and a host in another role.
      ['https://kontakt.commerzbank.de/login', 'https://t.co/AbC123xyz', 't.co'],
      ['account.comdirect.de', 'https://t.co/AbC123xyz', 't.co'],
      ['https://about.meta.com/hilfe', 'https://t.me/irgendwer', 't.me'],
      ['https://www.dropbox.com/s/abc/Bericht.pdf', 'https://x.com/irgendwer/status/1', 'x.com'],
      [
        'https://www.meine-bank.example/evil.example/login',
        'https://evil.example/login',
        'evil.example',
      ],
      [
        'https://www.meine-bank.example/login?ref=evil.example',
        'https://evil.example/login',
        'evil.example',
      ],
      [
        'https://evil.example@www.meine-bank.example/login',
        'https://evil.example/login',
        'evil.example',
      ],
    ])('says where %j leads when it leads to %s', (words, address, host) => {
      show(`[${words}](${address})`)
      expect(root().querySelector('.chat-md-link-where')?.textContent).toBe(` (${host})`)
    })

    it('names the address a mail link writes to', () => {
      show('[Schreib mir](mailto:anna@example.org)')
      expect(root().textContent).toBe('Schreib mir (anna@example.org)')
    })

    it.each([
      '[klick](javascript:alert(1))',
      '[klick](data:text/html,x)',
      '[klick](/intern)',
      '[klick](www.example.org)',
      '<javascript:alert(1)>',
    ])('makes no link of %j: the words stay as typed', (typed) => {
      show(typed)
      expect(root().querySelector('a')).toBeNull()
      expect(root().textContent).toBe(typed)
    })

    // Every link of a message, however it was written, leads where a link may lead.
    it('gives no link an address that begins with anything but http, https, ftp or mailto', () => {
      show(
        [
          '[a](javascript:alert(1)//https://example.org)',
          '<javascript:alert(1)//https://example.org>',
          '[a2](javascript://%0Aalert(1))',
          '<javascript://example.org/%0Aalert(1)>',
          '[a3](data://text/html,x) und [a4](file://server/freigabe)',
          '[b](https://example.org/b)',
          '<https://example.org/c>',
          'https://example.org/d und ftp://example.org/e und anna@example.org',
          '[f](mailto:anna@example.org)',
          '![g](https://example.org/g.png)',
        ].join('\n\n'),
      )
      const targets = [...root().querySelectorAll('a')].map((link) => link.getAttribute('href'))
      expect(targets.length).toBeGreaterThanOrEqual(7)
      for (const target of targets) expect(target).toMatch(/^(?:https?:\/\/|ftp:\/\/|mailto:)/)
    })

    // ⛔ A picture's address would tell its server who reads the message, and when.
    it('never fetches a picture: its address is a link', () => {
      show('![Logo](https://example.org/logo.png)')
      expect(root().querySelector('img')).toBeNull()
      expect(root().querySelector('a').getAttribute('href')).toBe('https://example.org/logo.png')
      expect(root().textContent).toBe('Logo (example.org)')
    })
  })

  /** ⛔ Nothing the other side wrote reaches the page as markup, wherever in a message it stands. */
  describe('markup in a message', () => {
    const HOSTILE = '<img src=x onerror="window.__hit = 1"><script>window.__hit = 1</script>'

    it.each([
      ['a stretch of text', HOSTILE],
      ['a heading', `# ${HOSTILE}`],
      ['an entry of a list', `- ${HOSTILE}\n- zwei`],
      ['a quotation', `> ${HOSTILE}`],
      ['a table', `| ${HOSTILE} | b |\n|---|---|\n| ${HOSTILE} | 2 |`],
      ['code', `\`\`\`\n${HOSTILE}\n\`\`\``],
      ['code in a line', `# x\n\n\`${HOSTILE}\``],
      ['emphasis', `# x\n\n**${HOSTILE}** und *${HOSTILE}*`],
      ['the words of a link', `[${HOSTILE}](https://example.org)`],
    ])('stays letters in %s', (where, typed) => {
      show(typed)
      expect(root().querySelector('img, script')).toBeNull()
      expect(root().textContent).toContain('<img src=x onerror="window.__hit = 1">')
      expect(window.__hit).toBeUndefined()
    })

    /**
     * An address with a quote in it is no address a link with words may lead to: the words stay
     * as typed. What the thread's own finder takes for an address in them is a link as in any
     * message -- up to the quote, which it never took into an address --, and the rest is letters.
     */
    it('makes no attribute of what stands behind a quote in an address', () => {
      show('[x](https://example.org/a"onmouseover="window.__hit = 1)')
      const links = root().querySelectorAll('a')
      expect(links).toHaveLength(1)
      expect(links[0].getAttribute('href')).toBe('https://example.org/a')
      expect([...links[0].attributes].map((attribute) => attribute.name).sort()).toEqual([
        'href',
        'rel',
        'target',
      ])
      expect(root().textContent).toBe('[x](https://example.org/a"onmouseover="window.__hit = 1)')
    })

    it('takes a quote the address may hold as part of the address', () => {
      show("[x](https://example.org/a'b)")
      const link = root().querySelector('a')
      expect(link.getAttribute('href')).toBe("https://example.org/a'b")
      expect(link.attributes).toHaveLength(3)
    })
  })

  /** Searched for in the thread (E-057): the hits are marked where they stand. */
  describe('while the thread is searched', () => {
    const marks = () =>
      [...root().querySelectorAll('mark.chat-search-mark')].map((mark) => mark.textContent)

    it('marks the hits in a plain message, as before', () => {
      show('Die Bank am Waldrand, die **Bank** im Park', { needle: 'bank' })
      expect(marks()).toEqual(['Bank', 'Bank'])
      expect(root().querySelector('strong mark')).not.toBeNull()
    })

    it('marks them in a heading, a list, a quotation, a table, code and a link’s words', () => {
      show(
        [
          '# Die Bank',
          '- eine *Bank*',
          '- und ein Stuhl',
          '> zur Bank',
          '',
          '| Bank | b |',
          '|---|---|',
          '| 1 | `bank` |',
          '',
          '```',
          'bank()',
          '```',
          '[zur Bank](https://example.org)',
        ].join('\n'),
        { needle: 'bank' },
      )
      expect(marks()).toEqual(['Bank', 'Bank', 'Bank', 'Bank', 'bank', 'bank', 'Bank'])
      expect(root().querySelector('h4 mark')).not.toBeNull()
      expect(root().querySelector('li em mark')).not.toBeNull()
      expect(root().querySelector('blockquote mark')).not.toBeNull()
      expect(root().querySelector('th mark')).not.toBeNull()
      expect(root().querySelector('td code mark')).not.toBeNull()
      expect(root().querySelector('pre mark')).not.toBeNull()
      expect(root().querySelector('a mark')).not.toBeNull()
    })
  })

  /**
   * A link to files is shown as its card (E-044) -- in a stretch of text, where it always stood,
   * also in an entry of a list or a quotation; in a heading, a table or an emphasised run the
   * address is a link like any other.
   */
  describe('a link to files', () => {
    const FILES = 'https://www.swisstransfer.com/d/1234abcd-12ab-34cd-56ef-1234567890ab'
    const cards = () => root().querySelectorAll('[data-test="file-card"]')

    it('is a card in a plain message, the room around it left out', () => {
      show(`Hier ist die Datei:\n${FILES}\nDanke!`)
      expect(cards()).toHaveLength(1)
      expect(root().textContent).toBe('Hier ist die Datei:Danke!')
    })

    it('is a card in a stretch of text of a Markdown message, and in an entry of a list', () => {
      show(`# Dateien\n\nHier: ${FILES}\n\n- eins ${FILES}\n- zwei`)
      expect(cards()).toHaveLength(2)
      expect(root().querySelector('li [data-test="file-card"]')).not.toBeNull()
    })

    it('is a link in a heading, a table and an emphasised run', () => {
      show(`# ${FILES}\n\n| a |\n|---|\n| ${FILES} |\n\n**${FILES}**`)
      expect(cards()).toHaveLength(0)
      expect(root().querySelectorAll(`a[href="${FILES}"]`)).toHaveLength(3)
    })
  })

  /** A video room's link keeps what it does in a plain message (V4a, V4b), wherever it stands. */
  describe('the link of a video room', () => {
    const ROOM = 'https://meet.ffmuc.net/k7m2x9q4t8wz#config.subject=%22Lesekreis%22'

    it('is shown without its addition and with its copy button, in a list as in plain text', () => {
      show(`- Raum: ${ROOM}\n- zwei`, { join: vi.fn() })
      const link = root().querySelector('li a.chat-video-link')
      expect(link.getAttribute('href')).toBe(ROOM)
      expect(link.textContent).toBe('https://meet.ffmuc.net/k7m2x9q4t8wz')
      expect(root().querySelector('li [data-test="video-copy"]').dataset.href).toBe(ROOM)
    })
  })

  it('reads the text anew when it changes: a message that was changed', async () => {
    show('schlicht')
    expect(root().tagName).toBe('SPAN')
    await wrapper.setProps({ text: '# jetzt ein Titel' })
    expect(root().tagName).toBe('DIV')
    expect(root().querySelector('h4').textContent).toBe('jetzt ein Titel')
    await wrapper.setProps({ text: 'wieder schlicht' })
    expect(root().tagName).toBe('SPAN')
    expect(root().textContent).toBe('wieder schlicht')
  })

  // The message is read once for a text, not at every picture the search makes.
  it('does not read the message again for a search', async () => {
    const reader = await import('@/utils/chatMarkdown')
    const read = vi.spyOn(reader, 'chatMarkdown')
    const needle = ref('')
    wrapper = mount(ChatMessageText, {
      props: { text: '# Die Bank\n\n- eins\n- zwei' },
      global: { provide: { [CHAT_SEARCH]: needle } },
    })
    const before = read.mock.calls.length
    expect(before).toBe(1)
    needle.value = 'bank'
    await wrapper.vm.$nextTick()
    expect(root().querySelector('mark')).not.toBeNull()
    expect(read.mock.calls.length).toBe(before)
    read.mockRestore()
  })

  // ⛔ Held by reading the source, comments left out: nothing in the reader or in what shows its
  // pieces hands a string to the page as markup.
  it.each(['./ChatMessageText.js', '../../utils/chatMarkdown.js'])(
    'sets no markup in %s',
    (file) => {
      const code = readFileSync(join(dirname(fileURLToPath(import.meta.url)), file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
      expect(code.length).toBeGreaterThan(2000)
      expect(code).not.toMatch(
        /innerHTML|outerHTML|v-html|insertAdjacentHTML|document\.write|domProps/,
      )
    },
  )
})
