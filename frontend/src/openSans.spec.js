// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
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
  it('has ten faces of one family', () => {
    expect(faces).toHaveLength(10)
    expect(new Set(faces.map(({ family }) => family))).toEqual(new Set(["'Open Sans'"]))
  })

  // ⛔ One face per file: Firefox and WebKit fetch a file once for every face of it a page
  // uses. Ending at 700: whatever asks for more is drawn in 700, as it always was.
  it('declares every face for the weights 300 to 700', () => {
    expect(faces.map(({ weight }) => weight)).toEqual(SUBSETS.map(() => '300 700'))
  })

  // ⛔ The ranges overlap, and among faces that match equally the later rule draws the
  // character. A sorted list would move characters to another file.
  it('keeps the order the family was served in', () => {
    expect(faces.map(({ address }) => address)).toEqual(
      SUBSETS.map((subset) => `/fonts/open-sans/open-sans-${subset}.woff2`),
    )
  })

  it('gives every face a range, and no font-display', () => {
    for (const { range } of faces) {
      expect(range).toMatch(/^U\+/)
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

// Inside the declared range a weight is drawn as asked. The wallet is drawn in 300, 400, 600
// and 700; a style that asks for 500 would draw bolder than every other place that did.
describe('the weights the wallet asks for', () => {
  const files = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? files(join(dir, entry.name))
        : /\.(s?css|vue|tsx?|js)$/.test(entry.name) && !/\.spec\.|\.test\./.test(entry.name)
          ? [join(dir, entry.name)]
          : [],
    )
  // Both wallets: the Mithril one draws with these styles and its own. Not read: gradido.css,
  // which is compiled (Bootstrap's `.fw-medium` stands in it, which no page uses), and the
  // declarations of the fonts, which ask for nothing.
  const sources = [here, resolve(here, '../../frontend-mithril/src')]
    .filter((dir) => existsSync(dir))
    .flatMap(files)
    .filter((file) => !/assets\/(css\/gradido\.css|fonts\/)/.test(file))
  const asked = sources.flatMap((file) =>
    [
      ...withoutComments(readFileSync(file, 'utf8')).matchAll(
        /font-weight:\s*(\d+)|\.font = `(\d+) |\bfw-(medium|semibold|bold|normal|light)\b/g,
      ),
    ].map(([, css, canvas, utility]) => ({
      file: relative(here, file),
      weight:
        css ??
        canvas ??
        { medium: '500', semibold: '600', bold: '700', normal: '400', light: '300' }[utility],
    })),
  )

  it('are really read', () => {
    expect(asked.length).toBeGreaterThan(100)
  })

  it('are the four the wallet is drawn in', () => {
    expect(asked.filter(({ weight }) => !['300', '400', '600', '700'].includes(weight))).toEqual([
      // the community's name, in Afacad, whose axis has 525
      { file: 'components/Menu/Navbar.module.scss', weight: '525' },
    ])
  })
})

describe('where Open Sans is seen', () => {
  // App's global stylesheet, since App is a .tsx file.
  const styles = [withoutComments(read('./App.css'))]

  it('reads the style of App.vue', () => {
    // The fixture proves itself: without it the assertions below would describe nothing.
    expect(styles.join()).toMatch(/#app\s*\{/)
  })

  // The pages inherit their font from `body`, as dialogs and toasts do. A family on `#app`
  // or anywhere in App.vue's style would take every page out of it again.
  it('gives the pages no font of their own: no style in App.vue names a font-family', () => {
    expect(styles.join()).not.toMatch(/font-family/)
  })

  // ⛔ `crossorigin` even on our own address: a font is always fetched in CORS mode, and a
  // preload without it does not match that request -- the browser fetches the file twice.
  it('preloads exactly one font, a file the declaration declares, with crossorigin', () => {
    const head = read('../index.html').replace(/<!--[\s\S]*?-->/g, '')
    const preloads = [...head.matchAll(/<link\b[^>]*\brel="preload"[^>]*>/g)].map(([tag]) => tag)
    expect(preloads).toHaveLength(1)
    const [tag] = preloads
    const address = tag.match(/\bhref="([^"]+)"/)?.[1]
    expect(faces.map((face) => face.address)).toContain(address)
    expect(existsSync(resolve(here, `../public${address}`)), address).toBe(true)
    expect(tag).toMatch(/\bas="font"/)
    expect(tag).toMatch(/\btype="font\/woff2"/)
    expect(tag).toMatch(/\scrossorigin[\s>=]/)
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
