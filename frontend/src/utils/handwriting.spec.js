// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { canWriteByHand } from './handwriting'

// ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
// instance of it away as coming from another realm.
const fontDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'fonts', 'caveat')

describe('canWriteByHand', () => {
  it('takes a line in the nine languages the font carries', () => {
    for (const line of [
      'Einfach so — weil es Dich gibt.',
      'Danke für Deine Mühe — es ist wunderbar geworden.',
      'Thank you for your help!',
      '¡Gracias por tu ayuda! ¿Nos vemos?',
      'Merci d’avoir pris le temps — ça m’a touché, cœur à cœur.',
      'Grazie per il tuo aiuto, è stato bellissimo.',
      'Dank je wel voor je hulp, mĳn vriend.',
      'Obrigada pela tua ajuda — não esqueço, coração.',
      'Yardımın için teşekkür ederim. İyi ki varsın, ışığım.',
      'Спасибо за помощь! Вы подарили мне день — ёлки, щедро.',
      'Дякую за допомогу, їжачку ґречний.',
    ]) {
      expect(canWriteByHand(line), line).toBe(true)
    }
  })

  // The typeface has no Greek. One letter of it and the whole line is set in the page's font.
  it('takes no line with a Greek letter in it, however few', () => {
    expect(canWriteByHand('Σε ευχαριστώ για τη βοήθειά σου!')).toBe(false)
    expect(canWriteByHand('Danke, Σοφία!')).toBe(false)
    expect(canWriteByHand('Thank you π')).toBe(false)
  })

  it('takes no line in a script beyond Latin and Cyrillic', () => {
    for (const line of [
      '谢谢你的帮助',
      'ありがとう',
      'شكرا لك',
      'תודה',
      'धन्यवाद',
      'Danke 𝓢arah',
    ]) {
      expect(canWriteByHand(line), line).toBe(false)
    }
  })

  // A heart is no letter set in the wrong hand: the line around it stays handwriting.
  it('lets signs that are no letters pass, whether the font has them or not', () => {
    expect(canWriteByHand('Danke 💛')).toBe(true)
    expect(canWriteByHand('Danke ♥ ✨ → 100 %')).toBe(true)
    expect(canWriteByHand('1000 Dank!')).toBe(true)
  })

  it('lets digits of another script decide like letters', () => {
    expect(canWriteByHand('Danke ١٢٣')).toBe(false)
  })

  it('takes an empty line, and none', () => {
    expect(canWriteByHand('')).toBe(true)
    expect(canWriteByHand(null)).toBe(true)
    expect(canWriteByHand(undefined)).toBe(true)
  })
})

describe('the font the ranges were read from', () => {
  // The ranges in handwriting.js are the code points of exactly this file. A new file is a new
  // list: read its cmap again (the recipe stands in handwriting.js), then change this sum.
  it('is the file the wallet ships', () => {
    const font = readFileSync(join(fontDir, 'Caveat-600.woff2'))
    expect(font.subarray(0, 4).toString('latin1')).toBe('wOF2')
    expect(createHash('sha256').update(font).digest('hex')).toBe(
      '39637c17f1090d05396f9ab130a923f3bf219446d3545ffa102edd970a6b7d14',
    )
  })

  it('has its licence lying beside it', () => {
    const licence = readFileSync(join(fontDir, 'OFL.txt'), 'utf8')
    expect(licence).toContain('The Caveat Project Authors')
    expect(licence).toContain('SIL OPEN FONT LICENSE Version 1.1')
  })
})
