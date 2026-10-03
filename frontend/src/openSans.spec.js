// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Open Sans ships with the wallet, in three places that cannot import each other: the files
// in public/fonts/open-sans/, the declaration in assets/fonts/open-sans/open-sans.css, and
// the import in main.js that puts the declaration into the bundled stylesheet. And the pages
// ask for it by the name _fonts.scss gives `body`. None of it fails loudly -- a face whose
// file is missing just draws in the fallback, a declaration nobody imports just declares
// nothing, a name nobody declares just draws every page in the fallback. So the places are
// held against each other.

// fileURLToPath is handed the string import.meta.url, never a URL object built here. The
// test environment brings its own URL class, and node rejects an instance of it as coming
// from the wrong realm -- which passes locally and fails in CI.
const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

// Comments out first, everywhere below: the declaration's head and App.vue's comment both
// name what they warn of, and a test that read them would hold the warning for the thing.
const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '')

const FONT_DIR = '../public/fonts/open-sans'
const declaration = withoutComments(read('./assets/fonts/open-sans/open-sans.css'))
const faces = [...declaration.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => ({
  family: body.match(/font-family:\s*([^;]+);/)?.[1],
  weight: body.match(/font-weight:\s*([^;]+);/)?.[1],
  address: body.match(/src:\s*url\('([^']+)'\)/)?.[1],
  range: body.match(/unicode-range:\s*([^;]+);/)?.[1],
  body,
}))
const SUBSETS = [
  'cyrillic-ext',
  'cyrillic',
  'greek-ext',
  'greek',
  'hebrew',
  'math',
  'symbols',
  'vietnamese',
  'latin-ext',
  'latin',
]

describe('the declaration of Open Sans', () => {
  it('has forty faces of one family', () => {
    expect(faces).toHaveLength(40)
    expect(new Set(faces.map(({ family }) => family))).toEqual(new Set(["'Open Sans'"]))
  })

  // ⛔ Not a range. Every file carries the whole weight axis, but `font-weight: 300 800`
  // would draw a text that asks for 500 in 500 instead of 400 -- bolder than it has been.
  it('declares four weights one by one, each for all ten subsets', () => {
    for (const weight of ['300', '400', '600', '700']) {
      expect(faces.filter((face) => face.weight === weight)).toHaveLength(10)
    }
  })

  // ⛔ The ranges overlap, and among faces that match equally the later rule draws the
  // character. A sorted list would move characters to another file.
  it('keeps the order the family was served in: subset by subset, weight by weight', () => {
    expect(faces.map(({ address }) => address)).toEqual(
      ['300', '400', '600', '700'].flatMap(() =>
        SUBSETS.map((subset) => `/fonts/open-sans/open-sans-${subset}.woff2`),
      ),
    )
    expect(faces.map(({ weight }) => weight)).toEqual(
      ['300', '400', '600', '700'].flatMap((weight) => SUBSETS.map(() => weight)),
    )
  })

  it('gives every face of a subset the same range, and no font-display', () => {
    for (const subset of SUBSETS) {
      const ranges = faces
        .filter(({ address }) => address.endsWith(`-${subset}.woff2`))
        .map(({ range }) => range)
      expect(ranges).toHaveLength(4)
      expect(new Set(ranges).size).toBe(1)
      expect(ranges[0]).toMatch(/^U\+/)
    }
    expect(declaration).not.toMatch(/font-display/)
  })

  it('points every face at a file that is in public/', () => {
    for (const { address } of faces) {
      expect(address).toMatch(/^\/fonts\/open-sans\/[a-z-]+\.woff2$/)
      expect(existsSync(resolve(here, `../public${address}`)), address).toBe(true)
    }
  })

  it('declares every font file that lies there, and the licence lies beside them', () => {
    const files = readdirSync(resolve(here, FONT_DIR))
    expect(files.filter((name) => name.endsWith('.woff2')).sort()).toEqual(
      [...new Set(faces.map(({ address }) => address.split('/').pop()))].sort(),
    )
    expect(files).toContain('OFL.txt')
    expect(read(`${FONT_DIR}/OFL.txt`)).toMatch(/SIL OPEN FONT LICENSE Version 1\.1/)
  })

  // ⛔ In the bundle, not as a .css file with a fixed name in public/: the server hands .css
  // out as immutable for a year. In the bundle the name changes with the content.
  it('reaches the page through main.js, and not as a stylesheet in public/', () => {
    const main = read('./main.js').replace(/^\s*\/\/.*$/gm, '')
    expect(main).toMatch(/^import '\.\/assets\/fonts\/open-sans\/open-sans\.css'$/m)
    expect(readdirSync(resolve(here, FONT_DIR)).filter((name) => name.endsWith('.css'))).toEqual([])
  })
})

describe('where Open Sans is seen', () => {
  const styles = [...read('./App.vue').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
    ([, body]) => withoutComments(body),
  )

  it('reads the style of App.vue', () => {
    // The fixture proves itself: without it the assertions below would describe nothing.
    expect(styles.join()).toMatch(/#app\s*\{/)
  })

  // The pages inherit their font from `body`, as dialogs and toasts do. A family on `#app`
  // or anywhere in App.vue's style would take every page out of it again.
  it('gives the pages no font of their own: no style in App.vue names a font-family', () => {
    expect(styles.join()).not.toMatch(/font-family/)
  })

  it('declares no face of its own in App.vue', () => {
    expect(styles.join()).not.toMatch(/@font-face/)
  })

  // _fonts.scss and the declaration do not import each other. If the name the pages ask for
  // is not the name declared, the browser draws every page in the fallback, silently.
  it('asks for the family the declaration declares', () => {
    const fonts = read('./assets/scss/custom/gradido-custom/_fonts.scss').replace(/\/\/.*$/gm, '')
    const asked = fonts.match(/^\$font-family-sans-serif:\s*([^,;]+)[,;]/m)?.[1].trim()
    expect(fonts).toMatch(/^\$font-family-base:\s*\$font-family-sans-serif\s*;/m)
    const declared = faces[0].family.replace(/^['"]|['"]$/g, '')
    expect(declared).toBe('Open Sans')
    expect(asked?.toLowerCase()).toBe(declared.toLowerCase())
  })
})
