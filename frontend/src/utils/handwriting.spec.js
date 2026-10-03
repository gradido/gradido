// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { canWriteByHand } from './handwriting'

// ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
// instance of it away as coming from another realm.
const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const fontDir = join(srcDir, 'assets', 'fonts', 'caveat')

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

/**
 * The face of the handwriting: declared in one file, for every component that sets a line in
 * it. Nothing of it fails loudly -- a face whose rule loses its name on the way into the
 * stylesheet is no face (App.vue's rule for WorkSans arrived there without one, for four
 * years), and a second declaration only shows as a second rule in the built stylesheet. So
 * the source is held here; the count in the bundle is measured with each delivery.
 */
describe('the declaration of the handwriting', () => {
  // Comments out first: the file explains what it must not do, and a search over the raw text
  // would find its own explanation.
  const live = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
  const declaration = live(readFileSync(join(fontDir, 'caveat.css'), 'utf8'))
  const faces = [...declaration.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => body)

  /** Every file under src that can hold a style or take one in, by its path from src. */
  const sources = (dir = srcDir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return sources(path)
      return /\.(vue|js|css|scss)$/.test(entry.name) && !/\.spec\.js$/.test(entry.name)
        ? [relative(srcDir, path)]
        : []
    })
  const read = (file) => readFileSync(join(srcDir, file), 'utf8')
  /** A component's script without its line comments: an import in a comment imports nothing. */
  const scriptOf = (file) => {
    const sfc = read(file)
    return sfc.slice(sfc.indexOf('<script'), sfc.indexOf('</script>')).replace(/^\s*\/\/.*$/gm, '')
  }
  const IMPORT = /^import '@\/assets\/fonts\/caveat\/caveat\.css'$/m

  it('is one face under one name, from the file beside it', () => {
    expect(faces).toHaveLength(1)
    const [face] = faces
    expect(face).toMatch(/font-family:\s*Caveat;/)
    expect(face).toMatch(/src:\s*url\('\.\/Caveat-600\.woff2'\)\s*format\('woff2'\);/)
    expect(face).toMatch(/font-weight:\s*600;/)
    expect(face).toMatch(/font-display:\s*swap;/)
    expect(face).not.toMatch(/!important|https?:|\/\//)
    expect(existsSync(join(fontDir, 'Caveat-600.woff2'))).toBe(true)
  })

  it('reads the files of src', () => {
    // The fixture proves itself: a walk that found nothing would hold everything below.
    const files = sources()
    expect(files.length).toBeGreaterThan(300)
    expect(files).toContain('assets/fonts/caveat/caveat.css')
    expect(files).toContain('components/Chat/ChatBubble.vue')
    expect(files).toContain('components/LinkInformations/RedeemThanksPaper.vue')
  })

  it('stands nowhere else: no other file declares a face of that name', () => {
    const declaring = sources().filter((file) =>
      [...live(read(file)).matchAll(/@font-face\s*\{([^}]*)\}/g)].some(([, body]) =>
        /font-family:\s*['"]?Caveat/.test(body),
      ),
    )
    expect(declaring).toEqual(['assets/fonts/caveat/caveat.css'])
  })

  // Whoever names the family takes the declaration in, from its script: without it the line
  // would stand in the fallback wherever the other component has not been loaded.
  it('is taken in by every component that sets a line in it, and by no other file', () => {
    const naming = sources()
      .filter((file) => file.endsWith('.vue') || file.endsWith('.scss'))
      .filter((file) => /font-family:\s*Caveat,/.test(live(read(file))))
      .sort()
    expect(naming).toEqual([
      'components/Chat/ChatBubble.vue',
      'components/LinkInformations/RedeemThanksPaper.vue',
    ])
    for (const file of naming) {
      expect(scriptOf(file), file).toMatch(IMPORT)
    }
    const importing = sources()
      .filter((file) => read(file).includes('fonts/caveat/caveat.css'))
      .sort()
    expect(importing).toEqual(naming)
  })
})
