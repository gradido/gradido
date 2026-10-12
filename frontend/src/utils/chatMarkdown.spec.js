// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { chatMarkdown, chatMarkdownInline, isPlainChatText } from './chatMarkdown'
import { chatTextParts } from './chatTextParts'

const txt = (value) => ({ type: 'text', value })
const url = (value) => ({ type: 'url', value })
const mail = (value) => ({ type: 'email', value })
const code = (value) => ({ type: 'code', value })
const bold = (...parts) => ({ type: 'bold', parts })
const italic = (...parts) => ({ type: 'italic', parts })
const strike = (...parts) => ({ type: 'strike', parts })
const link = (href, ...parts) => ({ type: 'link', href, parts })

const text = (...inline) => ({ type: 'text', inline })
const heading = (level, ...inline) => ({ type: 'heading', level, inline })
const fence = (lang, body) => ({ type: 'code', lang, text: body })
const quote = (...blocks) => ({ type: 'quote', blocks })
const rule = () => ({ type: 'rule' })
const bullets = (...items) => ({ type: 'list', ordered: false, items })
const numbers = (...items) => ({ type: 'list', ordered: true, items })
const entry = (...blocks) => ({ number: null, task: null, blocks })
const numbered = (number, ...blocks) => ({ number, task: null, blocks })
const box = (done, ...blocks) => ({ number: null, task: done, blocks })

/** The pieces as the reader before this one gave them: a bold run as one string. */
const asBefore = (inline) =>
  inline.map((part) =>
    part.type === 'bold' && part.parts.every((inner) => inner.type === 'text')
      ? { type: 'bold', value: part.parts.map((inner) => inner.value).join('') }
      : part,
  )

describe('chatMarkdown', () => {
  /**
   * ⛔ The first thing it has to do: leave a message alone that is no Markdown. Every chat
   * message goes through it (E-078), the ones written before it existed too, and what people
   * write to each other is full of signs Markdown has a meaning for.
   */
  describe('a message that is no Markdown', () => {
    const PLAIN = [
      'Hallo Anna, kommst Du morgen?',
      'Wir treffen uns am\n12. Oktober um 19 Uhr.',
      'Wir treffen uns am\n12. Oktober\n13. Oktober',
      'Bis dann!\n- Bernd',
      'Bis dann!\n\n- Bernd',
      'Liebe Grüße\n-- \nBernd',
      '1. Mai ist Feiertag, da bin ich nicht da.',
      '12. Oktober, 19 Uhr im Café',
      '- nur ein Gedanke',
      '* Sternchen: nur solange der Vorrat reicht',
      'Das macht 2*3*4 = 24.',
      'Schreib an bernd_h oder an anna_m, beide lesen mit.',
      'Die Datei heißt mein_erster_entwurf_v2.txt',
      'Liebe Freund*innen und Kolleg*innen',
      '*Liebe Freund*innen',
      'Preis: 5 €* pro Stück',
      // A star behind a word is a footnote's mark, twice in a sentence too: it opens nothing.
      'Angebot*, nur heute* und morgen',
      'a*b* c',
      // A sign with room before it closes nothing.
      'ein *Stern * mit Abstand',
      'ein _Strich _ mit Abstand',
      'das ~~ging ~~ daneben',
      '5 * 3 = 15 und 4 * 2 = 8',
      'a_b und c_d',
      '_ _ _ und * * * mitten im Satz',
      'C:\\Users\\Bernd\\Documents',
      'Der Pfad ist \\\\server\\freigabe',
      // A backslash is never taken away: a path keeps its place, and this one its arm.
      'S:\\Verein\\_Vorlagen\\Brief.docx',
      'C:\\Users\\Bernd\\_privat\\*.jpg und C:\\Bilder\\*.png',
      '\\\\server\\*',
      '¯\\_(ツ)_/¯',
      'snake\\_case und \\*kein Kursiv\\* und \\`kein Code\\` und \\~\\~nicht weg\\~\\~',
      // A backtick typed for an apostrophe opens no code.
      'Hallo Bernd, wie geht`s? Gibt`s was Neues?',
      'Rosi`s Café und Toni`s Pizzeria',
      // Signs that stand for themselves: where no word begins or ends, nothing opens or closes.
      'Pflichtfelder (*) und Hinweise (*) beachten',
      'Lösch alle *.* Dateien und alle *.tmp',
      '*_*',
      '^_^ und ^_^',
      ':_( das ist traurig :_(',
      '>_< und -_- und o_O',
      '@_bernd_ hat geschrieben',
      'Datei __init__.py anpassen, dann __main__.py',
      // "More than", and an arrow drawn both ways: no quotations.
      '> 100 GDD wäre gut',
      '< 5 Minuten\n> 10 Minuten',
      '>>> Achtung <<<',
      '>',
      '> ',
      '>\n>',
      // Stars somebody gave, and letters to guess: no rules.
      '*****',
      '***',
      '___',
      '_ _ _ _ _',
      '* * *',
      // Dashes before numbers are minus signs, and "01." is a day.
      '100 GDD\n- 20 GDD\n- 30 GDD\n= 50 GDD',
      'Heute:\n- 5 Grad morgens\n- 2 Grad mittags',
      'Termine:\n\n01. Mai – Wanderung\n08. Mai – Stammtisch',
      // A dash in a sentence is no point, and bars in a sentence make no table.
      'Montag - Yoga\nDienstag - Chor',
      'Mo | Di | Mi\n9 | 10 | 11',
      '5 > 3 und 2 < 4',
      '>:( und <3 und :-*',
      '>Das ist kein Zitat',
      '#gradido #dankbarkeit',
      '#1 in der Liste',
      '#',
      'Von 10-12 Uhr - danach bin ich weg.',
      '-',
      '--',
      '-- ',
      '+1',
      '+ noch ein Punkt',
      '+ eins\n+ zwei',
      // Far in from the margin is no list: such lines are somebody's own layout.
      '      - eingerückt eins\n      - eingerückt zwei',
      '1) erstens\n2) zweitens',
      '1.Mai\n2.Mai',
      'ca. 5 %\n100 % sicher',
      'Ja | Nein | Vielleicht',
      'a ~ b und ~5 Euro',
      '~~',
      '~~~~~~~~~~',
      'Oben\n~~~\nUnten',
      'Ein `einzelner Backtick',
      'Text mit    vielen   Leerzeichen\n    und Einrückung',
      '\tmit Tab',
      '\n\nzwei Leerzeilen davor',
      'zwei Leerzeilen danach\n\n',
      'Absatz eins\n\n\nAbsatz zwei',
      '<b>fett?</b> <script>alert(1)</script>',
      '[x] erledigt, [ ] offen',
      '[Klammer] (und runde)',
      '[Text](kein-link)',
      '[Text](javascript:alert(1))',
      '![Bild](data:image/png;base64,AAAA)',
      '=== Überschrift? ===\nText\n===',
      'Text\n=====',
      '',
      ' ',
    ]

    it.each(PLAIN)('leaves %j one stretch of text', (typed) => {
      const blocks = chatMarkdown(typed)
      expect(typed === '' ? blocks.length === 0 : isPlainChatText(blocks)).toBe(true)
      // Every character is still there, in its order, and nothing was made of any of them.
      const shown = blocks.flatMap((block) => block.inline)
      expect(shown.every((part) => ['text', 'url', 'email'].includes(part.type))).toBe(true)
      expect(shown.map((part) => part.value).join('')).toBe(typed)
    })

    // Bold (E-015) and the addresses were there before: read as they always were.
    it.each([
      'Das ist **wichtig** für alle.',
      '**Thema:** Vorstandssitzung\nhttps://meet.example.org/gradido-123',
      'Zwei **fette** Stellen, **noch eine**.',
      '**über\nzwei Zeilen**',
      'Ein Stern * allein und zwei ** allein',
      'Schreib an anna@example.org oder schau auf https://gradido.net/de/',
      'https://example.org/a_b_c/~user?x=1&y=_z_',
      '**',
      'a ** b',
      '** a ** b',
      '**a***',
      '***a**',
    ])('reads %j as the reader before it did', (typed) => {
      const blocks = chatMarkdown(typed)
      expect(isPlainChatText(blocks)).toBe(true)
      expect(asBefore(blocks[0].inline)).toEqual(chatTextParts(typed))
    })

    it('keeps the line breaks of a message as they were typed, also between two paragraphs', () => {
      expect(chatMarkdown('eins\nzwei\n\ndrei')).toEqual([text(txt('eins\nzwei\n\ndrei'))])
    })

    it('takes a Windows line break for a line break', () => {
      expect(chatMarkdown('eins\r\nzwei\rdrei')).toEqual([text(txt('eins\nzwei\ndrei'))])
    })

    it('takes nothing for a message', () => {
      expect(chatMarkdown(null)).toEqual([])
      expect(chatMarkdown(undefined)).toEqual([])
      expect(chatMarkdown('')).toEqual([])
    })
  })

  describe('a heading', () => {
    it.each([1, 2, 3, 4, 5, 6])('of level %i', (level) => {
      expect(chatMarkdown(`${'#'.repeat(level)} Titel`)).toEqual([heading(level, txt('Titel'))])
    })

    it('needs the space, and no more than six signs', () => {
      expect(isPlainChatText(chatMarkdown('#Amstetten'))).toBe(true)
      expect(isPlainChatText(chatMarkdown('####### sieben'))).toBe(true)
    })

    it('drops the signs that close it, and the room around it', () => {
      expect(chatMarkdown('##   Titel   ##  ')).toEqual([heading(2, txt('Titel'))])
      expect(chatMarkdown('## C# und F#')).toEqual([heading(2, txt('C# und F#'))])
      expect(chatMarkdown('# #')).toEqual([heading(1, txt('#'))])
      expect(chatMarkdown('# Titel #####')).toEqual([heading(1, txt('Titel'))])
    })

    it('reads its words as a line is read', () => {
      expect(chatMarkdown('# Der **neue** `Plan`')).toEqual([
        heading(1, txt('Der '), bold(txt('neue')), txt(' '), code('Plan')),
      ])
    })

    it('ends the text before it and begins the text after it, without their empty lines', () => {
      expect(chatMarkdown('Vorweg\n\n# Titel\n\nDanach\nnoch eine Zeile')).toEqual([
        text(txt('Vorweg')),
        heading(1, txt('Titel')),
        text(txt('Danach\nnoch eine Zeile')),
      ])
    })
  })

  describe('code between fences', () => {
    it('is taken as it stands: its signs, its empty lines, its indent', () => {
      const typed = 'So:\n```js\nconst a = **b**\n\n  # kein Titel\n- keine Liste\n```\nFertig.'
      expect(chatMarkdown(typed)).toEqual([
        text(txt('So:')),
        fence('js', 'const a = **b**\n\n  # kein Titel\n- keine Liste'),
        text(txt('Fertig.')),
      ])
    })

    it('runs to the end where its fence is never closed', () => {
      expect(chatMarkdown('```\neins\nzwei')).toEqual([fence('', 'eins\nzwei')])
    })

    it('is closed by a fence at least as long', () => {
      expect(chatMarkdown('````\n```\ninnen\n```\n````')).toEqual([fence('', '```\ninnen\n```')])
    })

    // A line of tildes is how people draw a line: no fence, or all under it would be code.
    it('is not opened by a line of tildes', () => {
      expect(isPlainChatText(chatMarkdown('Oben\n~~~~~~~~\nUnten\n~~~'))).toBe(true)
    })

    it('may be empty', () => {
      expect(chatMarkdown('```\n```')).toEqual([fence('', '')])
    })

    // What stands behind the opening fence is kept whole, the name of a language or not.
    it('keeps what stands behind its opening fence, whatever it is', () => {
      expect(chatMarkdown('```  bash  \nls\n```')).toEqual([fence('bash', 'ls')])
      expect(chatMarkdown('``` hier ein Beispiel\nls\n```')).toEqual([
        fence('hier ein Beispiel', 'ls'),
      ])
    })

    // Three backticks around words on ONE line are code in the line, not a fence left open.
    it('is not opened by a line that closes its backticks itself', () => {
      expect(chatMarkdown('``` kurz ```\nweiter')).toEqual([text(code('kurz'), txt('\nweiter'))])
    })
  })

  describe('a rule', () => {
    it.each(['---', '- - -', '-----', ' ---', '---  ', '-  -  -'])(
      'is %j on a line of its own',
      (line) => {
        expect(chatMarkdown(`oben\n\n${line}\n\nunten`)).toEqual([
          text(txt('oben')),
          rule(),
          text(txt('unten')),
        ])
      },
    )

    // Dashes under a line of words underline it: no heading is made of the words (no "Setext").
    it('under a line of text is a rule under that text', () => {
      expect(chatMarkdown('Einkaufsliste\n-------------\nMilch')).toEqual([
        text(txt('Einkaufsliste')),
        rule(),
        text(txt('Milch')),
      ])
    })

    it('is not two dashes, and not dashes with words', () => {
      expect(isPlainChatText(chatMarkdown('oben\n--\nunten'))).toBe(true)
      expect(isPlainChatText(chatMarkdown('--- Schnitt ---'))).toBe(true)
    })
  })

  describe('a quotation', () => {
    it('is the lines that begin with the sign and a space', () => {
      expect(chatMarkdown('> eins\n> zwei\ndanach')).toEqual([
        quote(text(txt('eins\nzwei'))),
        text(txt('danach')),
      ])
    })

    // In its place: the words before it are shown before it.
    it('stands where it was written, between the words around it', () => {
      expect(chatMarkdown('Du schriebst:\n> morgen um 10\nPasst!')).toEqual([
        text(txt('Du schriebst:')),
        quote(text(txt('morgen um 10'))),
        text(txt('Passt!')),
      ])
    })

    /**
     * ⛔ Not where the sign means "more than" or draws an arrow -- asked of the FIRST line only: a
     * line quoted further down may well begin with a number.
     */
    it('is none where its first line begins with a number, or ends with the sign turned round', () => {
      expect(isPlainChatText(chatMarkdown('> 100 GDD wäre gut'))).toBe(true)
      expect(isPlainChatText(chatMarkdown('>>> Achtung <<<'))).toBe(true)
      expect(chatMarkdown('> Wir treffen uns am\n> 12. Oktober')).toEqual([
        quote(text(txt('Wir treffen uns am\n12. Oktober'))),
      ])
    })

    // Nothing behind the sign, on any of its lines: an empty quotation was an empty bubble.
    it('is none where nothing is quoted', () => {
      for (const typed of ['>', '> ', '>\n>', '>\n> \n>']) {
        expect(isPlainChatText(chatMarkdown(typed)), JSON.stringify(typed)).toBe(true)
      }
      expect(chatMarkdown('>\n> doch etwas')).toEqual([quote(text(txt('doch etwas')))])
      // All of the lines or none: the second line of "more than" is no quotation of its own.
      expect(isPlainChatText(chatMarkdown('> 100 GDD wäre gut\n> und mehr noch besser'))).toBe(true)
    })

    it('holds what a message holds: a heading, a list, another quotation', () => {
      expect(chatMarkdown('> # Titel\n> - a\n> - b\n>\n> > innen')).toEqual([
        quote(
          heading(1, txt('Titel')),
          bullets(entry(text(txt('a'))), entry(text(txt('b')))),
          quote(text(txt('innen'))),
        ),
      ])
    })

    it('stops being read as one below a depth, and stays text there', () => {
      const deep = `${'> '.repeat(9)}tief`
      const levels = (blocks, depth = 0) =>
        blocks[0]?.type === 'quote' ? levels(blocks[0].blocks, depth + 1) : depth
      expect(levels(chatMarkdown(deep))).toBe(6)
    })
  })

  describe('a list', () => {
    it('of points, with either sign', () => {
      expect(chatMarkdown('- Milch\n- Brot\n* Eier')).toEqual([
        bullets(entry(text(txt('Milch'))), entry(text(txt('Brot'))), entry(text(txt('Eier')))),
      ])
    })

    it('of numbers, shown as they were typed', () => {
      expect(chatMarkdown('3. drei\n4. vier\n7. sieben')).toEqual([
        numbers(
          numbered(3, text(txt('drei'))),
          numbered(4, text(txt('vier'))),
          numbered(7, text(txt('sieben'))),
        ),
      ])
    })

    it('right under a line of text, where it has two entries', () => {
      expect(chatMarkdown('Einkaufen:\n- Milch\n- Brot')).toEqual([
        text(txt('Einkaufen:')),
        bullets(entry(text(txt('Milch'))), entry(text(txt('Brot')))),
      ])
      expect(chatMarkdown('So geht es:\n1. öffnen\n2. schließen')).toEqual([
        text(txt('So geht es:')),
        numbers(numbered(1, text(txt('öffnen'))), numbered(2, text(txt('schließen')))),
      ])
    })

    it('keeps an entry of several lines together, and an empty line between two entries', () => {
      expect(chatMarkdown('- eins\n  weiter\n\n- zwei')).toEqual([
        bullets(entry(text(txt('eins\nweiter'))), entry(text(txt('zwei')))),
      ])
    })

    it('holds a list in an entry, by its indent -- one entry is enough there', () => {
      expect(chatMarkdown('- oben\n  - innen\n- unten')).toEqual([
        bullets(
          entry(text(txt('oben')), bullets(entry(text(txt('innen'))))),
          entry(text(txt('unten'))),
        ),
      ])
      expect(chatMarkdown('1. oben\n   - innen a\n   - innen b\n2. unten')).toEqual([
        numbers(
          numbered(
            1,
            text(txt('oben')),
            bullets(entry(text(txt('innen a'))), entry(text(txt('innen b')))),
          ),
          numbered(2, text(txt('unten'))),
        ),
      ])
    })

    it('holds code in an entry', () => {
      expect(chatMarkdown('1. so:\n   ```\n   x = 1\n   ```\n2. fertig')).toEqual([
        numbers(
          numbered(1, text(txt('so:')), fence('', 'x = 1')),
          numbered(2, text(txt('fertig'))),
        ),
      ])
    })

    it('reads boxes to tick', () => {
      expect(chatMarkdown('- [ ] offen\n- [x] erledigt\n- [X] auch\n- [y] kein Kästchen')).toEqual([
        bullets(
          box(false, text(txt('offen'))),
          box(true, text(txt('erledigt'))),
          box(true, text(txt('auch'))),
          entry(text(txt('[y] kein Kästchen'))),
        ),
      ])
    })

    it('ends where a line stands at the margin again', () => {
      expect(chatMarkdown('- a\n- b\nund weiter')).toEqual([
        bullets(entry(text(txt('a'))), entry(text(txt('b')))),
        text(txt('und weiter')),
      ])
    })

    it('does not mix points and numbers', () => {
      expect(chatMarkdown('- a\n- b\n1. eins\n2. zwei')).toEqual([
        bullets(entry(text(txt('a'))), entry(text(txt('b')))),
        numbers(numbered(1, text(txt('eins'))), numbered(2, text(txt('zwei')))),
      ])
    })

    // A line of an entry that is indented less than its words still belongs to it, whole.
    it('keeps every letter of a line that continues an entry', () => {
      expect(chatMarkdown('1. Punkt eins\n  Fortsetzung\n2. Punkt zwei')).toEqual([
        numbers(
          numbered(1, text(txt('Punkt eins\nFortsetzung'))),
          numbered(2, text(txt('Punkt zwei'))),
        ),
      ])
    })

    /**
     * ⛔ Every line of an entry loses the same indent. Cut each by its own, a point under a point
     * under a numbered entry stood beside its parent (the second reader, 12.10.2026).
     */
    it('keeps the levels under a numbered entry apart', () => {
      expect(chatMarkdown('1. a\n  - kind\n    - enkel\n2. b')).toEqual([
        numbers(
          numbered(
            1,
            text(txt('a')),
            bullets(entry(text(txt('kind')), bullets(entry(text(txt('enkel')))))),
          ),
          numbered(2, text(txt('b'))),
        ),
      ])
      expect(chatMarkdown('10. a\n   - kind\n     - enkel\n11. b')[0].items[0].blocks[1]).toEqual(
        bullets(entry(text(txt('kind')), bullets(entry(text(txt('enkel')))))),
      )
    })

    /**
     * ⛔ Code between fences belongs to its entry down to the closing fence, however it is
     * indented: people indent the fences and not the code. Left open at the entry's end, the
     * fence made code of everything after the list.
     */
    it('keeps code between fences in its entry where only the fences are indented', () => {
      expect(chatMarkdown('- a\n- Beispiel:\n  ```\nx = 1\n\n  y = 2\n  ```\nEnde')).toEqual([
        bullets(
          entry(text(txt('a'))),
          entry(text(txt('Beispiel:')), fence('', 'x = 1\n\n  y = 2')),
        ),
        text(txt('Ende')),
      ])
    })

    // …and where the fence opens on the entry's own line, the entry ends with the closing fence.
    it('ends code that begins on the line of its entry with its closing fence', () => {
      expect(chatMarkdown('- ```\n  npm i\n  ```\n- zwei')).toEqual([
        bullets(entry(fence('', 'npm i')), entry(text(txt('zwei')))),
      ])
      expect(chatMarkdown('1. ```js\nconst a = 1\n```\n2. zwei')).toEqual([
        numbers(numbered(1, fence('js', 'const a = 1')), numbered(2, text(txt('zwei')))),
      ])
    })

    it('takes a tab at the beginning of a line for an indent', () => {
      expect(chatMarkdown('- a\n\t- b\n- c')).toEqual([
        bullets(entry(text(txt('a')), bullets(entry(text(txt('b'))))), entry(text(txt('c')))),
      ])
    })

    // A dash before a number may be a minus sign: such lines alone are no list, among others they are.
    it('takes dashes before numbers for points only among other points', () => {
      expect(isPlainChatText(chatMarkdown('- 2 Äpfel\n- 3 Birnen'))).toBe(true)
      expect(chatMarkdown('- Milch\n- 2 Eier\n- Brot')).toEqual([
        bullets(entry(text(txt('Milch'))), entry(text(txt('2 Eier'))), entry(text(txt('Brot')))),
      ])
      expect(chatMarkdown('* 2 Äpfel\n* 3 Birnen')).toEqual([
        bullets(entry(text(txt('2 Äpfel'))), entry(text(txt('3 Birnen')))),
      ])
    })

    // "01." is a day, not the first of a list: its zero would be gone.
    it('takes no number that begins with a zero for a list', () => {
      expect(isPlainChatText(chatMarkdown('01. Mai\n08. Mai'))).toBe(true)
      expect(chatMarkdown('0. null\n1. eins')).toEqual([
        numbers(numbered(0, text(txt('null'))), numbered(1, text(txt('eins')))),
      ])
    })

    // One point that holds points: a list all the same.
    it('needs no second entry where its one entry holds a list', () => {
      expect(chatMarkdown('- Hauptpunkt\n  - eins\n  - zwei')).toEqual([
        bullets(
          entry(
            text(txt('Hauptpunkt')),
            bullets(entry(text(txt('eins'))), entry(text(txt('zwei')))),
          ),
        ),
      ])
    })

    // A date in an entry, right under its words, is no list in the list.
    it('leaves a date under the words of an entry alone', () => {
      expect(chatMarkdown('- Treffen am\n  12. Oktober\n- Abbau am\n  13. Oktober')).toEqual([
        bullets(
          entry(text(txt('Treffen am\n12. Oktober'))),
          entry(text(txt('Abbau am\n13. Oktober'))),
        ),
      ])
    })
  })

  describe('a table', () => {
    it('is a line of cells over a line of as many dashes', () => {
      expect(
        chatMarkdown('| Name | Betrag |\n|------|-------:|\n| Anna | 20 |\n| Bernd | 100 |'),
      ).toEqual([
        {
          type: 'table',
          align: [null, 'right'],
          head: [[txt('Name')], [txt('Betrag')]],
          rows: [
            [[txt('Anna')], [txt('20')]],
            [[txt('Bernd')], [txt('100')]],
          ],
        },
      ])
    })

    it('needs no bars at its ends, and says how each column is set', () => {
      expect(chatMarkdown('a | b | c\n:-- | :-: | --:\n1 | 2 | 3')[0]).toMatchObject({
        type: 'table',
        align: ['left', 'center', 'right'],
        rows: [[[txt('1')], [txt('2')], [txt('3')]]],
      })
    })

    // Nothing somebody wrote is left out: what a long line has too much stands in its last cell.
    it('fills a short line, and keeps what a long one has too much in its last cell', () => {
      expect(chatMarkdown('| a | b |\n|---|---|\n| 1 |\n| 1 | 2 | 3 | 4 |')[0].rows).toEqual([
        [[txt('1')], []],
        [[txt('1')], [txt('2 | 3 | 4')]],
      ])
      expect(
        chatMarkdown('| a | b |\n|---|---|\n| 1 | 2 |\nJa | Nein | Vielleicht')[0].rows.at(-1),
      ).toEqual([[txt('Ja')], [txt('Nein | Vielleicht')]])
    })

    // A bar in code is part of the code: that is what the backticks around it say.
    it('does not cut a cell at a bar that stands in code', () => {
      expect(chatMarkdown('| Name | Betrag |\n|---|---|\n| `a|b` | zwei |')[0].rows).toEqual([
        [[code('a|b')], [txt('zwei')]],
      ])
      // Backticks without their partner on the line are no code: the bar behind them cuts.
      expect(chatMarkdown('| a | b |\n|---|---|\n| ``x|`y`` | `offen | zwei |')[0].rows).toEqual([
        [[code('x|`y')], [txt('`offen | zwei')]],
      ])
    })

    it('reads its cells as a line is read, and a bar behind a backslash as a bar', () => {
      expect(chatMarkdown('| Was | Wie |\n|---|---|\n| **fett** | `a \\| b` |')[0].rows).toEqual([
        [[bold(txt('fett'))], [code('a | b')]],
      ])
    })

    it('ends at an empty line, and at a line without a bar', () => {
      expect(chatMarkdown('| a | b |\n|---|---|\n| 1 | 2 |\ndanach').at(-1)).toEqual(
        text(txt('danach')),
      )
      expect(chatMarkdown('| a | b |\n|---|---|\n| 1 | 2 |\n\n| kein | Kopf |').at(-1)).toEqual(
        text(txt('| kein | Kopf |')),
      )
    })

    it('is none where the dashes are not as many as the cells over them', () => {
      expect(isPlainChatText(chatMarkdown('| a | b |\n|---|\n| 1 | 2 |'))).toBe(true)
    })

    it('may stand right under a line of text', () => {
      expect(chatMarkdown('Die Zahlen:\n| a | b |\n|---|---|\n| 1 | 2 |')).toMatchObject([
        text(txt('Die Zahlen:')),
        { type: 'table' },
      ])
    })
  })

  // What a text from an AI tool looks like: everything at once.
  it('reads a whole document', () => {
    const typed = [
      '## Stand',
      '',
      'Der Bau ist **fertig**, die Prüfung läuft.',
      '',
      '1. Fenster',
      '2. Markdown',
      '   - Tabellen',
      '',
      '> Bitte bis *Freitag* ansehen.',
      '',
      '---',
      '',
      '```bash',
      'bun run test',
      '```',
    ].join('\n')
    expect(chatMarkdown(typed)).toEqual([
      heading(2, txt('Stand')),
      text(txt('Der Bau ist '), bold(txt('fertig')), txt(', die Prüfung läuft.')),
      numbers(
        numbered(1, text(txt('Fenster'))),
        numbered(2, text(txt('Markdown')), bullets(entry(text(txt('Tabellen'))))),
      ),
      quote(text(txt('Bitte bis '), italic(txt('Freitag')), txt(' ansehen.'))),
      rule(),
      fence('bash', 'bun run test'),
    ])
  })
})

describe('chatMarkdownInline', () => {
  describe('bold', () => {
    it('is two stars and the next two, as it always was', () => {
      expect(chatMarkdownInline('a **b** c')).toEqual([txt('a '), bold(txt('b')), txt(' c')])
      expect(chatMarkdownInline('**a\nb**')).toEqual([bold(txt('a\nb'))])
      expect(chatMarkdownInline('**a** und **b**')).toEqual([
        bold(txt('a')),
        txt(' und '),
        bold(txt('b')),
      ])
    })

    it('is two underscores around a word', () => {
      expect(chatMarkdownInline('das ist __wichtig__.')).toEqual([
        txt('das ist '),
        bold(txt('wichtig')),
        txt('.'),
      ])
    })

    // Before, a pair of stars never reached across an address: now the address is bold with the rest.
    it('reaches across an address', () => {
      expect(chatMarkdownInline('**siehe https://gradido.net jetzt**')).toEqual([
        bold(txt('siehe '), url('https://gradido.net'), txt(' jetzt')),
      ])
    })

    it('and italic at once is three stars', () => {
      expect(chatMarkdownInline('***sehr***')).toEqual([bold(italic(txt('sehr')))])
    })

    // The reader before this one made a bold star of five stars and dropped the other four.
    it('is not made of stars alone', () => {
      expect(chatMarkdownInline('Bewertung: *****')).toEqual([txt('Bewertung: *****')])
    })
  })

  describe('italic', () => {
    it('is one star or one underscore around words', () => {
      expect(chatMarkdownInline('das ist *schön* und _gut_.')).toEqual([
        txt('das ist '),
        italic(txt('schön')),
        txt(' und '),
        italic(txt('gut')),
        txt('.'),
      ])
      expect(chatMarkdownInline('*zwei Wörter*')).toEqual([italic(txt('zwei Wörter'))])
    })

    it('stays on its line', () => {
      expect(chatMarkdownInline('*eins\nzwei*')).toEqual([txt('*eins\nzwei*')])
    })

    it('stands around words with their marks, and in a compound', () => {
      expect(chatMarkdownInline('*"Zitat"* und *(Einschub)* und *Hinweis:* und *Ende.*')).toEqual([
        italic(txt('"Zitat"')),
        txt(' und '),
        italic(txt('(Einschub)')),
        txt(' und '),
        italic(txt('Hinweis:')),
        txt(' und '),
        italic(txt('Ende.')),
      ])
      expect(chatMarkdownInline('das *Chat*-Fenster, (*wichtig*) und „*so*“.')).toEqual([
        txt('das '),
        italic(txt('Chat')),
        txt('-Fenster, ('),
        italic(txt('wichtig')),
        txt(') und „'),
        italic(txt('so')),
        txt('“.'),
      ])
    })

    it('may end on a sum or a measure', () => {
      expect(chatMarkdownInline('*5 €* und *20 %* und *-5 °*')).toEqual([
        italic(txt('5 €')),
        txt(' und '),
        italic(txt('20 %')),
        txt(' und '),
        italic(txt('-5 °')),
      ])
    })

    it('holds code, a link and an address as it holds a word', () => {
      expect(
        chatMarkdownInline('*`code`* und *https://gradido.net* und _[da](https://gradido.net)_'),
      ).toEqual([
        italic(code('code')),
        txt(' und '),
        italic(url('https://gradido.net')),
        txt(' und '),
        italic(link('https://gradido.net', txt('da'))),
      ])
    })

    it.each([
      ['2*3*4', 'between numbers'],
      ['Freund*innen und Kolleg*innen', 'inside words'],
      ['a * b * c', 'with room on both sides'],
      ['*offen ohne Ende', 'without its partner'],
      ['ende * ohne* Anfang', 'with room behind the first'],
      ['snake_case_name', 'underscores inside a name'],
      ['_a_b', 'an underscore that closes before a letter'],
      ['a_b_', 'an underscore that opens behind a letter'],
      ['(*) und (*)', 'stars in brackets'],
      ['*.* und *.*', 'stars around a full stop'],
      ['*_*', 'a face'],
      ['^_^ und ^_^', 'noses'],
      [':_( und :_(', 'tears'],
      ['@_bernd_', 'a name behind an at-sign'],
      ['__init__.py', 'a name with a full stop behind its signs'],
      ['*) und (*', 'signs the wrong way round'],
      ['* nicht* und *nicht *', 'room inside the signs'],
      ['*) gilt nur heute*', 'a mark of a footnote: no word begins behind the sign'],
      ['*, das ist ein Stern*', 'a comma behind the sign'],
      ['*auf (* und zu', 'no word ends before the sign'],
      ['_auf „_ und zu', 'no word ends before an underscore either'],
    ])('leaves %j alone: %s', (typed) => {
      expect(chatMarkdownInline(typed)).toEqual([txt(typed)])
    })

    /**
     * A sign that found no partner is not looked for again on its stretch (the reader's own
     * memory, for messages made of nothing but opening signs) -- and the stretch of a sign that
     * stays on its line ends with the line: the next line begins anew.
     */
    it('is read on the next line where a sign on the line before found no partner', () => {
      expect(chatMarkdownInline('*offen ohne Ende\nund *kursiv* hier')).toEqual([
        txt('*offen ohne Ende\nund '),
        italic(txt('kursiv')),
        txt(' hier'),
      ])
      expect(chatMarkdownInline('_offen\n_kursiv_ und __fett__')).toEqual([
        txt('_offen\n'),
        italic(txt('kursiv')),
        txt(' und '),
        bold(txt('fett')),
      ])
      expect(chatMarkdownInline('~~offen\n~~weg~~')).toEqual([txt('~~offen\n'), strike(txt('weg'))])
      // …and on the same line a second pair is found behind a sign that had none before it closed.
      expect(chatMarkdownInline('a* und *b* und *c*')).toEqual([
        txt('a* und '),
        italic(txt('b')),
        txt(' und '),
        italic(txt('c')),
      ])
    })

    it('holds bold, and bold holds italic', () => {
      expect(chatMarkdownInline('*a **b** c*')).toEqual([
        italic(txt('a '), bold(txt('b')), txt(' c')),
      ])
      expect(chatMarkdownInline('**a *b* c**')).toEqual([
        bold(txt('a '), italic(txt('b')), txt(' c')),
      ])
    })
  })

  describe('struck text', () => {
    it('is two tildes on either side', () => {
      expect(chatMarkdownInline('~~alt~~ neu')).toEqual([strike(txt('alt')), txt(' neu')])
    })

    it.each(['~5 Euro~', '~5 Euro~~', '~~ offen', 'a ~~ b ~~ c', '~~eins\nzwei~~'])(
      'is not %j',
      (typed) => {
        expect(chatMarkdownInline(typed)).toEqual([txt(typed)])
      },
    )
  })

  describe('code in a line', () => {
    it('is what stands between two backticks, as it stands', () => {
      expect(chatMarkdownInline('nimm `a_b` und `**c**`')).toEqual([
        txt('nimm '),
        code('a_b'),
        txt(' und '),
        code('**c**'),
      ])
    })

    it('may hold a backtick between two of them, the room around it left out', () => {
      expect(chatMarkdownInline('`` a ` b ``')).toEqual([code('a ` b')])
    })

    it('keeps an address an address of letters: no link in code', () => {
      expect(chatMarkdownInline('`https://gradido.net`')).toEqual([code('https://gradido.net')])
    })

    it('keeps a backslash a backslash', () => {
      expect(chatMarkdownInline('`a\\*b`')).toEqual([code('a\\*b')])
    })

    // ⛔ A backtick typed for an apostrophe: no word runs into the sign that opens code.
    it('opens only where no word runs into the backtick', () => {
      expect(chatMarkdownInline('wie geht`s? Gibt`s was Neues?')).toEqual([
        txt('wie geht`s? Gibt`s was Neues?'),
      ])
      expect(chatMarkdownInline('geht`s und `code` und Toni`s')).toEqual([
        txt('geht`s und '),
        code('code'),
        txt(' und Toni`s'),
      ])
      // …and may close before one: "`div`s" is code and an s.
      expect(chatMarkdownInline('zwei `div`s')).toEqual([txt('zwei '), code('div'), txt('s')])
    })

    it('stays on its line, and a backtick without its partner stays a backtick', () => {
      expect(chatMarkdownInline('`eins\nzwei`')).toEqual([txt('`eins\nzwei`')])
      expect(chatMarkdownInline('ein ` allein')).toEqual([txt('ein ` allein')])
    })

    it('ends bold and italic at its edge: their signs inside it are letters', () => {
      expect(chatMarkdownInline('**a `b**` c**')).toEqual([bold(txt('a '), code('b**'), txt(' c'))])
    })
  })

  /**
   * ⛔ A backslash is never taken away. Before a sign it keeps the sign from meaning anything, as
   * in Markdown -- and stays, unlike there: taken away, a path lost its place and the man who
   * shrugs an arm.
   */
  describe('a backslash', () => {
    it('keeps the sign behind it from meaning anything, and stays', () => {
      expect(chatMarkdownInline('snake\\_case und \\*kein Kursiv\\*')).toEqual([
        txt('snake\\_case und \\*kein Kursiv\\*'),
      ])
      expect(chatMarkdownInline('\\`kein Code\\`')).toEqual([txt('\\`kein Code\\`')])
      expect(chatMarkdownInline('\\*\\*nicht fett\\*\\*')).toEqual([txt('\\*\\*nicht fett\\*\\*')])
      expect(chatMarkdownInline('\\~\\~nicht weg\\~\\~')).toEqual([txt('\\~\\~nicht weg\\~\\~')])
    })

    // …also for the pair it would have made with the next one: two stars are bold anywhere.
    it('keeps a star from making a pair with the next', () => {
      expect(chatMarkdownInline('\\**nicht fett** und \\__auch nicht__')).toEqual([
        txt('\\**nicht fett** und \\__auch nicht__'),
      ])
    })

    // The sign behind it is out of play, the ones around it are not.
    it('leaves the other signs of the line what they are', () => {
      expect(chatMarkdownInline('*kursiv* und \\*nicht\\* und *wieder*')).toEqual([
        italic(txt('kursiv')),
        txt(' und \\*nicht\\* und '),
        italic(txt('wieder')),
      ])
    })

    it('stays a backslash before anything else', () => {
      expect(chatMarkdownInline('C:\\Users\\Bernd und a\\nb')).toEqual([
        txt('C:\\Users\\Bernd und a\\nb'),
      ])
    })
  })

  describe('a link with words', () => {
    it('leads to a web address, an ftp address or a mail address', () => {
      expect(chatMarkdownInline('siehe [die Seite](https://gradido.net/de/) dazu')).toEqual([
        txt('siehe '),
        link('https://gradido.net/de/', txt('die Seite')),
        txt(' dazu'),
      ])
      expect(chatMarkdownInline('[Datei](ftp://example.org/a.zip)')).toEqual([
        link('ftp://example.org/a.zip', txt('Datei')),
      ])
      expect(chatMarkdownInline('[Mail](mailto:anna@example.org)')).toEqual([
        link('mailto:anna@example.org', txt('Mail')),
      ])
    })

    // ⛔ The address is the other side's: only where a link may lead.
    it.each([
      '[klick](javascript:alert(1))',
      '[klick](JAVASCRIPT:alert(1))',
      '[klick](javascript:alert(1)//https://example.org)',
      // The classic: two slashes make a comment of the rest of the line, %0A ends the line.
      '[klick](javascript://%0Aalert(1))',
      '[klick](javascript://example.org/%0Aalert(1))',
      '[klick](data://text/html,x)',
      '[klick](vbscript://x)',
      '[klick](file://server/freigabe)',
      '[klick](x-https://example.org)',
      '[klick](javascript:alert(1)//mailto:anna@example.org)',
      '[klick](xmailto:anna@example.org)',
      // A quote in an address is no title: no room stands before it.
      "[klick](https://example.org/'x')",
      '[klick](mailto:anna@example.org,https://example.org)',
      '[klick](data:text/html,<script>alert(1)</script>)',
      '[klick](vbscript:x)',
      '[klick](file:///etc/passwd)',
      '[klick](//example.org)',
      '[klick](/intern)',
      '[klick](#anker)',
      '[klick](www.example.org)',
      '[klick]( https://example.org/a b )',
      '[klick](https://example.org/"onmouseover="x)',
      '[klick](mailto:anna@example.org?subject=x)',
      '[klick]()',
      '[](https://example.org)',
      '[ ](https://example.org)',
      '[klick] (https://example.org)',
    ])('makes no link with words of %j', (typed) => {
      const parts = chatMarkdownInline(typed)
      expect(parts.some((part) => part.type === 'link')).toBe(false)
    })

    it('keeps the words their emphasis and their code', () => {
      expect(chatMarkdownInline('[**fett** und `code`](https://example.org)')).toEqual([
        link('https://example.org', bold(txt('fett')), txt(' und '), code('code')),
      ])
    })

    // The words may look like an address: they stay words, and no second link is made in the link.
    it('makes no link in the words', () => {
      expect(chatMarkdownInline('[https://bank.example](https://anders.example)')).toEqual([
        link('https://anders.example', txt('https://bank.example')),
      ])
    })

    it('takes an address with brackets, in angle brackets, and leaves a title out', () => {
      expect(
        chatMarkdownInline('[Wiki](https://de.wikipedia.org/wiki/Bank_(Sitzgelegenheit))'),
      ).toEqual([link('https://de.wikipedia.org/wiki/Bank_(Sitzgelegenheit)', txt('Wiki'))])
      expect(chatMarkdownInline('[a](<https://example.org/x>)')).toEqual([
        link('https://example.org/x', txt('a')),
      ])
      expect(chatMarkdownInline('[a](https://example.org/x "Titel")')).toEqual([
        link('https://example.org/x', txt('a')),
      ])
      expect(chatMarkdownInline("[a](<https://example.org/x>   'Ti tel')")).toEqual([
        link('https://example.org/x', txt('a')),
      ])
      // A quote that is part of the address stays part of it: no room stands before it.
      expect(chatMarkdownInline("[a](https://example.org/it's)")).toEqual([
        link("https://example.org/it's", txt('a')),
      ])
    })

    // ⛔ Nothing is fetched: a picture's address would tell its server who reads the message.
    it('makes a link of a picture, never a picture', () => {
      expect(chatMarkdownInline('![Logo](https://example.org/logo.png)')).toEqual([
        link('https://example.org/logo.png', txt('Logo')),
      ])
    })

    it('stays on its line', () => {
      expect(
        chatMarkdownInline('[eins\nzwei](https://example.org)').some(
          (part) => part.type === 'link',
        ),
      ).toBe(false)
    })
  })

  describe('an address', () => {
    it('is a link where it stands, as before', () => {
      expect(
        chatMarkdownInline('schau auf https://gradido.net/de/ oder schreib an anna@example.org.'),
      ).toEqual([
        txt('schau auf '),
        url('https://gradido.net/de/'),
        txt(' oder schreib an '),
        mail('anna@example.org'),
        txt('.'),
      ])
    })

    it('keeps its own signs: underscores, stars and tildes in it mean nothing', () => {
      expect(chatMarkdownInline('_siehe_ https://example.org/a_b_c/~x~~y und _da_')).toEqual([
        italic(txt('siehe')),
        txt(' '),
        url('https://example.org/a_b_c/~x~~y'),
        txt(' und '),
        italic(txt('da')),
      ])
    })

    it('in angle brackets is read behind words too', () => {
      expect(chatMarkdownInline('Schau: <https://gradido.net> und weiter')).toEqual([
        txt('Schau: '),
        url('https://gradido.net'),
        txt(' und weiter'),
      ])
    })

    it('in angle brackets is the address without them', () => {
      expect(chatMarkdownInline('<https://gradido.net> und <kein link>')).toEqual([
        url('https://gradido.net'),
        txt(' und <kein link>'),
      ])
    })

    // ⛔ Angle brackets make an address of nothing that is none: only where a link may lead.
    it.each([
      '<javascript:alert(1)>',
      '<javascript://%0Aalert(1)>',
      '<javascript://example.org/%0Aalert(1)>',
      '<data:text/html,x>',
      '<file://server/freigabe>',
      '<www.example.org>',
    ])('in angle brackets is no link where it is %j', (typed) => {
      expect(chatMarkdownInline(typed)).toEqual([txt(typed)])
    })

    // What stands in them is read as any text is: an address in it is that address, no more.
    it('in angle brackets leaves a text with an address in it a text with that address', () => {
      expect(chatMarkdownInline('<javascript:alert(1)//https://example.org>')).toEqual([
        txt('<javascript:alert(1)//'),
        url('https://example.org'),
        txt('>'),
      ])
      expect(chatMarkdownInline('<mailto:anna@example.org>')).toEqual([
        txt('<mailto:'),
        mail('anna@example.org'),
        txt('>'),
      ])
    })
  })

  /**
   * ⛔ The text is somebody else's. Whatever it holds, what comes out is a tree of the kinds
   * above, each with strings in it -- nothing that could be taken for markup, and no end of work.
   */
  describe('a message made to trouble the reader', () => {
    const kinds = (parts) =>
      parts.flatMap((part) => [part.type, ...(part.parts ? kinds(part.parts) : [])])
    const depthOf = (parts) =>
      parts.reduce((most, part) => Math.max(most, part.parts ? 1 + depthOf(part.parts) : 0), 0)

    it('keeps markup as letters', () => {
      const typed = '<img src=x onerror=alert(1)> **<b>x</b>** [<i>y</i>](https://example.org)'
      expect(new Set(kinds(chatMarkdownInline(typed)))).toEqual(new Set(['text', 'bold', 'link']))
    })

    it('stops nesting at a depth', () => {
      const typed = `${'*a '.repeat(40)}${'a* '.repeat(40)}`
      expect(depthOf(chatMarkdownInline(typed))).toBeLessThanOrEqual(6)
    })

    /**
     * ⛔ Whatever is typed, nothing somebody wrote goes missing. Random messages made of words
     * and of every sign the reader knows, with a fixed seed: no throw, every letter and digit
     * shown in the order typed, and a message in which nothing was read as a sign shown sign for
     * sign. (Six hundred thousand of these found three ways to lose text while the reader was
     * written: words behind an opening fence, code that began on the line of its list entry,
     * the spaces of an empty line.)
     */
    it('keeps every letter and digit of random messages, in their order', () => {
      let seed = 20261012
      const next = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0
        return seed / 4294967296
      }
      const PIECES = [
        ...[
          'a',
          'b',
          'Wort',
          'zwei Wörter',
          '12',
          '5',
          ' ',
          ' ',
          ' ',
          '\n',
          '\n',
          '\n\n',
          '\t',
          '  ',
          '    ',
        ],
        ...[
          '*',
          '**',
          '***',
          '_',
          '__',
          '~',
          '~~',
          '`',
          '``',
          '```',
          '\\',
          '#',
          '# ',
          '## ',
          '-',
          '- ',
          '* ',
        ],
        ...[
          '1. ',
          '12. ',
          '01. ',
          '>',
          '> ',
          '>> ',
          '|',
          ' | ',
          '---',
          '|---|---|',
          '[',
          ']',
          '(',
          ')',
        ],
        ...[
          '[x] ',
          '[ ] ',
          '<',
          '!',
          '.',
          ',',
          ':',
          '"',
          "'",
          'https://gradido.net/a_b',
          'anna@example.org',
        ],
        ...['ä', 'ß', '€', '😀', '\r\n'],
      ]
      const inlineWords = (parts) =>
        parts.map((part) => (part.parts ? inlineWords(part.parts) : part.value)).join('')
      const words = (block) => {
        if (block.type === 'text' || block.type === 'heading') return inlineWords(block.inline)
        if (block.type === 'code') return `${block.lang} ${block.text}`
        if (block.type === 'quote') return block.blocks.map(words).join(' ')
        if (block.type === 'table') {
          return [block.head, ...block.rows].map((row) => row.map(inlineWords).join(' ')).join(' ')
        }
        if (block.type !== 'list') return ''
        return block.items
          .map(
            (item) =>
              `${item.number ?? ''}${item.task ? 'x' : ''} ${item.blocks.map(words).join(' ')}`,
          )
          .join(' ')
      }
      const lettersOf = (typed) => (typed.match(/[\p{L}\p{N}]/gu) ?? []).join('').toLowerCase()

      for (let round = 0; round < 4000; round += 1) {
        const length = 1 + Math.floor(next() * 28)
        const typed = Array.from({ length }, () => PIECES[Math.floor(next() * PIECES.length)])
          .join('')
          .replace(/\r\n?/g, '\n')
        const blocks = chatMarkdown(typed)
        // A link with words does not show its address, and that is meant: left out of the count.
        if (typed.includes('](')) continue
        expect(lettersOf(blocks.map(words).join(' ')), JSON.stringify(typed)).toBe(lettersOf(typed))
        const pieces = blocks.length === 1 && blocks[0].type === 'text' ? blocks[0].inline : null
        const untouched = pieces?.every((part) => ['text', 'url', 'email'].includes(part.type))
        // …and an address in angle brackets is shown without them.
        if (untouched && !/<(?:https?|ftp):/i.test(typed)) {
          expect(pieces.map((part) => part.value).join(''), JSON.stringify(typed)).toBe(typed)
        }
      }
    })

    /**
     * A message is 5000 characters at most (MESSAGE_MAX_CHARS); these are four times that and
     * more, and of the kinds that took the square of their length before each was looked at
     * once: opening signs without partners, brackets never closed, a numbered stretch under a
     * line of text. Read in a moment, they are; the limit is wide, for a slow machine.
     */
    it.each([
      ['opening stars', '*a '.repeat(7000)],
      ['opening underscores', '_a '.repeat(7000)],
      ['opening tildes', '~~a '.repeat(5000)],
      ['pairs of stars with room between', '** '.repeat(7000)],
      ['three stars and a letter', '***a '.repeat(4000)],
      [
        'backticks in runs that never match',
        Array.from({ length: 190 }, (unused, n) => `${'`'.repeat(n + 1)}a`).join(''),
      ],
      ['opening square brackets', '['.repeat(20000)],
      // Five times longer than the others: a link is looked for only where a bracket still
      // closes on the line, and without that every one of these looked 2000 characters ahead.
      ['links never closed', '[a](b'.repeat(20000)],
      ['angle brackets', '<a'.repeat(10000)],
      // Brackets in brackets around a long run of spaces and a quote: every one of them looked
      // back over the spaces for a title (half a second for a message of 2000 characters).
      [
        'links around a run of spaces',
        // Twelve lines, each as long as an address may be: looked back over, each took most of
        // a second.
        Array.from(
          { length: 12 },
          () => `${'[a]('.repeat(170)}${' '.repeat(1365)}"${')'.repeat(170)}`,
        ).join('\n'),
      ],
      ['a heading with room in it', `# a${' '.repeat(20000)}b`],
      ['a heading that ends in signs', `# a${' #'.repeat(10000)}b`],
      ['a fence with a long word behind it', `\`\`\`${'x'.repeat(20000)}\``],
      ['a rule that is none', `${'- '.repeat(10000)}x`],
      [
        'bars without end',
        `${'| a '.repeat(5000)}\n${'|---'.repeat(5000)}\n${'| `b '.repeat(5000)}`,
      ],
      [
        'a numbered stretch under a line',
        `Text\n${Array.from({ length: 2500 }, (unused, n) => `${n + 5}. x`).join('\n')}`,
      ],
      ['single points, each under a line', 'Text\n- a\n'.repeat(2000)],
      ['quotations in quotations', `${'> '.repeat(2000)}tief\n`.repeat(5)],
      [
        'points in points',
        Array.from({ length: 400 }, (unused, n) => `${' '.repeat(2 * n)}- x`).join('\n'),
      ],
      ['lines of bars', '| a | b |\n'.repeat(2000)],
    ])('reads %s in a moment', (name, typed) => {
      const began = performance.now()
      expect(Array.isArray(chatMarkdown(typed))).toBe(true)
      expect(performance.now() - began).toBeLessThan(1000)
    })
  })
})
