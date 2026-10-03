// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The wallet makes no visitor's browser fetch from a foreign host when a page loads. Until
// October 2026 every page did: index.html linked a stylesheet at fonts.googleapis.com (which
// pulled the font from fonts.gstatic.com) and one at use.fontawesome.com -- signed out as
// well, so the three hosts learned of every visit (AGENTS.md, pillar 2).
//
// Nothing here runs in a test and nothing fails when such a line comes back: the page looks
// the same. So the two places a load-time fetch can be written are read instead -- the
// elements of index.html and the addresses in the styles.
//
// ⚠️ What is checked is how an address BEGINS, not what it contains. A font that ships with
// the wallet is fine whatever it is called, and a `data:` address carries
// `http://www.w3.org/2000/svg` inside it without fetching anything.

// fileURLToPath is handed the string import.meta.url, never a URL object built here. The
// test environment brings its own URL class, and node rejects an instance of it as coming
// from the wrong realm -- which passes locally and fails in CI.
const here = dirname(fileURLToPath(import.meta.url))
const read = (path) => readFileSync(path, 'utf8')

// http://, https:// or protocol-relative //
const isForeign = (address) => /^(?:https?:)?\/\//i.test(address.trim())

/** The addresses of everything index.html makes the browser fetch by an element. */
const embeds = (html) => {
  const found = []
  // Comments first: a line that is commented out fetches nothing, and a comment that
  // explains this rule must not trip it.
  const live = html.replace(/<!--[\s\S]*?-->/g, '')
  for (const [, tag, attributes] of live.matchAll(/<(link|script|img|iframe)\b([^>]*)>/gi)) {
    const pattern = /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
    for (const [, double, single, bare] of attributes.matchAll(pattern)) {
      found.push({ tag: tag.toLowerCase(), address: double ?? single ?? bare })
    }
  }
  return found
}

/** The addresses a stylesheet makes the browser fetch: every url(...) and every @import. */
const styleAddresses = (css) => {
  const live = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // An SCSS line comment -- only where a line or a declaration has just ended, so that the
    // `//` of `url(//host/...)` is never taken for one.
    .replace(/(^|[;{}])([ \t]*)\/\/[^\n]*/gm, '$1$2')
  const found = []
  for (const [, double, single, bare] of live.matchAll(
    /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi,
  )) {
    found.push(double ?? single ?? bare)
  }
  for (const [, address] of live.matchAll(/@import\s+["']([^"']+)["']/gi)) {
    found.push(address)
  }
  return found
}

/** What a file contributes to the stylesheets: all of it, or the style blocks of a component. */
const stylesOf = (file) => {
  const text = read(file)
  if (!file.endsWith('.vue')) return text
  return [...text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(([, body]) => body)
    .join('\n')
}

// Walked by hand: `readdirSync(dir, { recursive: true })` is silently ignored by a Node older
// than 18.17, and a guard that only saw the top level would stay green for ever.
const styleFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return styleFiles(path)
    return /\.(?:scss|css|vue)$/.test(name) ? [path] : []
  })

describe('how the guard reads', () => {
  it('tells a foreign address by how it begins', () => {
    expect(isForeign('https://fonts.example/css?family=Some+Font')).toBe(true)
    expect(isForeign('http://cdn.example/all.css')).toBe(true)
    expect(isForeign('//cdn.example/all.css')).toBe(true)
    expect(isForeign('/fonts/open-sans/open-sans-latin.woff2')).toBe(false)
    expect(isForeign('./assets/logo.png')).toBe(false)
    expect(isForeign("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'%3e")).toBe(false)
  })

  it('finds the two lines index.html carried, and leaves a commented one alone', () => {
    const html = `<head>
      <link rel="icon" href="/favicon.png">
      <link rel="stylesheet" href="https://fonts.example/css?family=Some+Font:300,400">
      <link rel=stylesheet href=//cdn.example/releases/v5/css/all.css crossorigin="anonymous">
      <!-- <script src="https://cdn.example/old.js"></script> -->
      <script type="module" src="/src/main.js"></script>
    </head>`
    expect(embeds(html).filter(({ address }) => isForeign(address))).toEqual([
      { tag: 'link', address: 'https://fonts.example/css?family=Some+Font:300,400' },
      { tag: 'link', address: '//cdn.example/releases/v5/css/all.css' },
    ])
  })

  it('finds a foreign url() and a foreign @import in a style, and not one in a comment', () => {
    const css = `
      @import 'https://fonts.example/css';
      @import url("//fonts.example/more.css");
      /* @import 'https://fonts.example/commented.css'; */
      // src: url(https://fonts.example/line-comment.woff2);
      @font-face { font-family: X; src: url(https://fonts.example/x.woff2) format('woff2'); }
      .a { background: url('/img/a.png'); } // url(https://fonts.example/after-a-rule.png)
      .b { background: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'%3e"); }
    `
    expect(styleAddresses(css).filter(isForeign)).toEqual([
      '//fonts.example/more.css',
      'https://fonts.example/x.woff2',
      'https://fonts.example/css',
    ])
  })
})

describe('index.html', () => {
  const found = embeds(read(resolve(here, '../index.html')))

  it('is really read: its own script and icons are seen', () => {
    expect(found).toContainEqual({ tag: 'script', address: '/src/main.js' })
    expect(found.filter(({ tag }) => tag === 'link').length).toBeGreaterThan(2)
  })

  it('embeds nothing from a foreign host', () => {
    expect(found.filter(({ address }) => isForeign(address))).toEqual([])
  })
})

describe('the styles under src', () => {
  const files = styleFiles(here)
  const addresses = files.flatMap((file) =>
    styleAddresses(stylesOf(file)).map((address) => ({ file: relative(here, file), address })),
  )

  it('are really read: all of them, and the addresses in them', () => {
    expect(files.length).toBeGreaterThan(200)
    // The forty faces of Open Sans alone are forty addresses.
    expect(addresses.length).toBeGreaterThan(40)
    // The case the guard must not trip over is in the tree: an inline SVG names its
    // namespace, which is an http:// address inside a data: address.
    expect(
      addresses.filter(
        ({ address }) => address.startsWith('data:') && address.includes('http://www.w3.org/'),
      ).length,
    ).toBeGreaterThan(0)
  })

  it('load nothing from a foreign host', () => {
    expect(addresses.filter(({ address }) => isForeign(address))).toEqual([])
  })
})
