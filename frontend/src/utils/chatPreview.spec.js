// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { chatPreviewLine, chatPreviewWords } from './chatPreview'

const t = (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key)
const n = (value, format) => `${format}(${value})`
const i18n = { t, n }

const message = (fields = {}) => ({
  mine: false,
  excerpt: 'Hallo',
  hasImage: false,
  amount: null,
  senderUser: null,
  ...fields,
})

describe('chatPreviewWords', () => {
  // Bernd's choice (E-083): the beginning in ONE line -- every break a space, as the quotation over
  // an answer has it.
  it('puts the lines of a message on one line', () => {
    expect(chatPreviewWords('Hallo Bernd,\n\nich wollte Dir sagen,\n  dass es klappt.')).toBe(
      'Hallo Bernd, ich wollte Dir sagen, dass es klappt.',
    )
  })

  it('reads the signs the bubble reads, and shows only the words', () => {
    expect(chatPreviewWords('**Wichtig:** morgen _um zehn_ ~~nicht~~ `heute`')).toBe(
      'Wichtig: morgen um zehn nicht heute',
    )
    expect(chatPreviewWords('# Protokoll\n- Punkt eins\n- Punkt zwei')).toBe(
      'Protokoll Punkt eins Punkt zwei',
    )
    expect(chatPreviewWords('> ein Zitat\n\n[der Link](https://gradido.net)')).toBe(
      'ein Zitat der Link',
    )
    expect(chatPreviewWords('| Tag | Zeit |\n| --- | --- |\n| Mo | 10 |')).toBe('Tag Zeit Mo 10')
    expect(chatPreviewWords('vorher\n\n---\n\nnachher')).toBe('vorher nachher')
  })

  // ⛔ What the bubble keeps, the line keeps: no sign is taken that the bubble shows.
  it('keeps what an ordinary message holds', () => {
    expect(chatPreviewWords('2*3*4 und snake_case, - 5 Grad, geht`s?')).toBe(
      '2*3*4 und snake_case, - 5 Grad, geht`s?',
    )
    expect(chatPreviewWords('S:\\Verein\\_Vorlagen')).toBe('S:\\Verein\\_Vorlagen')
    expect(chatPreviewWords('https://gradido.net/faq')).toBe('https://gradido.net/faq')
  })

  it('shows the signs themselves where a message is made of signs alone', () => {
    expect(chatPreviewWords('---')).toBe('---')
    expect(chatPreviewWords('---\n\n---')).toBe('--- ---')
  })

  it('says nothing for nothing', () => {
    expect(chatPreviewWords('')).toBe('')
    expect(chatPreviewWords(null)).toBe('')
    expect(chatPreviewWords('  \n ')).toBe('')
  })
})

describe('chatPreviewLine', () => {
  it("names nobody in front of the other person's message", () => {
    expect(chatPreviewLine(message({ excerpt: 'Morgen?' }), i18n)).toEqual({
      by: '',
      label: '',
      words: 'Morgen?',
      picture: false,
    })
  })

  it('says "Du" in front of one\'s own message', () => {
    expect(chatPreviewLine(message({ mine: true, excerpt: 'Bis morgen!' }), i18n).by).toBe(
      'chatThread.you',
    )
  })

  it('names the writer the server named in a group, by the name the wallet gives them', () => {
    const elfi = { alias: 'Elfi', gradidoID: 'elfi-id' }
    expect(chatPreviewLine(message({ senderUser: elfi }), i18n).by).toBe('Elfi')
    // Without an alias, the name every list gives such a member (memberAlias).
    expect(
      chatPreviewLine(message({ senderUser: { alias: null, gradidoID: 'abcdef12-3456' } }), i18n)
        .by,
    ).not.toBe('')
  })

  it('says "Du" for one\'s own message in a group too, whatever the server named', () => {
    const line = chatPreviewLine(
      message({ mine: true, senderUser: { alias: 'Bernd', gradidoID: 'b' } }),
      i18n,
    )
    expect(line.by).toBe('chatThread.you')
  })

  describe('a picture', () => {
    it('says "Bild" where it has no words', () => {
      // "Bild" says what is there; nobody wrote it, so it is no words (and stands upright).
      expect(chatPreviewLine(message({ excerpt: '', hasImage: true }), i18n)).toEqual({
        by: '',
        label: 'chatThread.imageReady',
        words: '',
        picture: true,
      })
    })

    it('shows its caption where it has one', () => {
      expect(chatPreviewLine(message({ excerpt: 'Der Garten', hasImage: true }), i18n)).toEqual({
        by: '',
        label: '',
        words: 'Der Garten',
        picture: true,
      })
    })
  })

  describe('a booking', () => {
    const booking = (fields = {}) =>
      message({ mine: true, excerpt: 'Danke für Deine Hilfe', amount: '20.0000', ...fields })

    // The amount as the thread writes it (ChatThread): without its sign, as a decimal.
    it('shows the Gradido and the memo', () => {
      expect(chatPreviewLine(booking(), i18n)).toEqual({
        by: 'chatThread.you',
        label: 'decimal(20) GDD',
        words: 'Danke für Deine Hilfe',
        picture: false,
      })
    })

    it('names nobody in front of what one was given', () => {
      expect(chatPreviewLine(booking({ mine: false }), i18n).by).toBe('')
    })

    it('takes the amount without its sign, whichever way it came', () => {
      expect(chatPreviewLine(booking({ amount: '-7.5000' }), i18n).label).toBe('decimal(7.5) GDD')
    })

    it('shows the amount alone where the memo says nothing', () => {
      expect(chatPreviewLine(booking({ excerpt: '' }), i18n)).toMatchObject({
        label: 'decimal(20) GDD',
        words: '',
      })
    })

    it('is a booking even for an amount of nothing', () => {
      expect(chatPreviewLine(booking({ amount: '0' }), i18n)).toMatchObject({
        label: 'decimal(0) GDD',
        words: 'Danke für Deine Hilfe',
      })
    })
  })
})
