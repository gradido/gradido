// AI-GENERATED — not an architecture reference
import {
  isOneLine,
  isThankYouMotif,
  memoBeginsWithLine,
  THANK_YOU_LINE_MAX_CHARS,
  THANK_YOU_MOTIFS,
  THANK_YOU_RECIPIENT_NAME_MAX_CHARS,
} from './ThankYouGreeting.logic'

describe('the motifs of a thank-you greeting', () => {
  // Written out: a key is the name of a file in the wallet and the value of a column, so a
  // key that changes here changes nothing there by itself.
  it('are these five, by these keys', () => {
    expect([...THANK_YOU_MOTIFS]).toEqual([
      'heart-leaves',
      'giving-hands',
      'bouquet',
      'glowing-swirl',
      'morning-light',
    ])
  })

  it('knows its own and no other', () => {
    for (const motif of THANK_YOU_MOTIFS) {
      expect(isThankYouMotif(motif)).toBe(true)
    }
    for (const other of ['', 'sunset', 'Heart-Leaves', 'heart-leaves ', 'heart_leaves']) {
      expect(isThankYouMotif(other)).toBe(false)
    }
  })
})

describe('the lengths of a thank-you greeting', () => {
  // The columns hold 120 and 64 (migration 0152); the bounds stay under them.
  it('are 80 for the line and 40 for the name', () => {
    expect(THANK_YOU_LINE_MAX_CHARS).toBe(80)
    expect(THANK_YOU_RECIPIENT_NAME_MAX_CHARS).toBe(40)
  })
})

describe('isOneLine', () => {
  it('takes what a line may hold', () => {
    for (const text of [
      'Einfach so — weil es Dich gibt.',
      'Σε ευχαριστώ για τη βοήθειά σου!',
      'Спасибо за помощь!',
      'Danke 💛',
      "O'Brien-Müller",
    ]) {
      expect(isOneLine(text)).toBe(true)
    }
  })

  it('refuses a line break, a tab, any control character and the Unicode separators', () => {
    for (const text of [
      'Danke\nfür alles',
      'Danke\r\nfür alles',
      'Danke\tfür alles',
      `Danke${String.fromCharCode(0)}`,
      `Danke${String.fromCharCode(0x1b)}[31m`,
      `Danke${String.fromCharCode(0x7f)}`,
      `Danke${String.fromCharCode(0x85)}für alles`,
      `Danke${String.fromCharCode(0x2028)}für alles`,
      `Danke${String.fromCharCode(0x2029)}für alles`,
    ]) {
      expect(isOneLine(text)).toBe(false)
    }
  })
})

describe('memoBeginsWithLine', () => {
  const LINE = 'Danke für Deine Hilfe!'

  it('holds for a memo that is exactly the line', () => {
    expect(memoBeginsWithLine(LINE, LINE)).toBe(true)
  })

  it('holds for the line, one line break, and the words', () => {
    expect(memoBeginsWithLine(`${LINE}\nOhne Dich stünde die Bank noch schief.`, LINE)).toBe(true)
    // The words may run over several lines of their own.
    expect(memoBeginsWithLine(`${LINE}\nLiebe Sarah,\n\nes war schön.\nDeine Oma`, LINE)).toBe(true)
  })

  it('does not hold where the memo says something else first', () => {
    expect(memoBeginsWithLine('Liebe Sarah, danke für Deine Hilfe!', LINE)).toBe(false)
    expect(memoBeginsWithLine(` ${LINE}`, LINE)).toBe(false)
    expect(memoBeginsWithLine('Danke für Deine Hilfe', LINE)).toBe(false)
    expect(memoBeginsWithLine(LINE.toLowerCase(), LINE)).toBe(false)
  })

  // The card cuts the line off at the line break; anything else between the two would leave
  // the card and the booking saying different things.
  it('does not hold where line and words are joined by anything but one line break', () => {
    expect(memoBeginsWithLine(`${LINE} Ohne Dich stünde die Bank schief.`, LINE)).toBe(false)
    expect(memoBeginsWithLine(`${LINE}Ohne Dich`, LINE)).toBe(false)
    expect(memoBeginsWithLine(`${LINE}\n\nOhne Dich`, LINE)).toBe(false)
    expect(memoBeginsWithLine(`${LINE}\r\nOhne Dich`, LINE)).toBe(false)
  })

  it('does not hold for a line break with nothing after it', () => {
    expect(memoBeginsWithLine(`${LINE}\n`, LINE)).toBe(false)
  })
})
