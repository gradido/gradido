// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { inLogoFace } from './logoFace'

// ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
// instance of it away as coming from another realm.
const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const fontDir = join(srcDir, 'assets', 'fonts', 'afacad')

describe('inLogoFace', () => {
  it('takes the names of the communities there are, and Latin names with their marks', () => {
    for (const name of [
      'Gradido-Akademie',
      'KI Playground',
      'Gradido Development Stage1',
      'Künzelsau & Hohenlohe',
      'Comunidad de Málaga – Año 2026',
      'Société d’Échange, cœur à cœur',
      'Gmina Łódź',
      'İstanbul Topluluğu',
    ]) {
      expect(inLogoFace(name), name).toBe(true)
    }
  })

  // The typeface is Latin only. One letter beyond it and the whole name is set in the page's
  // font, as a line of the handwriting is.
  it('takes no name with a letter of another script in it, however few', () => {
    for (const name of ['Κοινότητα Αθήνας', 'Громада Київ', 'Gradido Ελλάδα', 'קהילה', '共同体']) {
      expect(inLogoFace(name), name).toBe(false)
    }
  })

  it('lets signs that are no letters pass, whether the font has them or not', () => {
    expect(inLogoFace('Gradido ♥ 2026')).toBe(true)
    expect(inLogoFace('Gradido → Welt')).toBe(true)
  })

  it('lets digits of another script decide like letters', () => {
    expect(inLogoFace('Gradido ١٢٣')).toBe(false)
  })

  it('takes an empty name, and none', () => {
    expect(inLogoFace('')).toBe(true)
    expect(inLogoFace(null)).toBe(true)
    expect(inLogoFace(undefined)).toBe(true)
  })
})

describe('the font the ranges were read from', () => {
  // The ranges in logoFace.js are the code points of exactly this file. A new file is a new
  // list: read its cmap again (the recipe stands in logoFace.js), then change this sum.
  it('is the file the wallet ships', () => {
    const font = readFileSync(join(fontDir, 'Afacad-525.woff2'))
    expect(font.subarray(0, 4).toString('latin1')).toBe('wOF2')
    expect(createHash('sha256').update(font).digest('hex')).toBe(
      '3297d474e29c30a450a1f9bfb9529fa4be49629a3e175564a2e7f8a39cced95f',
    )
  })

  it('has its licence lying beside it', () => {
    const licence = readFileSync(join(fontDir, 'OFL.txt'), 'utf8')
    expect(licence).toContain('The Afacad Project Authors')
    expect(licence).toContain('SIL OPEN FONT LICENSE Version 1.1')
  })
})

/**
 * The face of the community's name: declared in one file and taken in by the one component
 * that sets the name in it. Nothing of it fails loudly (see handwriting.spec.js), so the
 * source is held here.
 */
describe('the declaration of the typeface', () => {
  // Comments out first: the file explains what it does not do, and a search over the raw
  // text would find its own explanation.
  const live = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
  const declaration = live(readFileSync(join(fontDir, 'afacad.css'), 'utf8'))
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

  it('is one face under one name, from the file beside it', () => {
    expect(faces).toHaveLength(1)
    const [face] = faces
    expect(face).toMatch(/font-family:\s*Afacad;/)
    expect(face).toMatch(/src:\s*url\('\.\/Afacad-525\.woff2'\)\s*format\('woff2'\);/)
    expect(face).toMatch(/font-weight:\s*525;/)
    expect(face).toMatch(/font-display:\s*block;/)
    expect(face).not.toMatch(/!important|https?:|\/\//)
    expect(existsSync(join(fontDir, 'Afacad-525.woff2'))).toBe(true)
  })

  it('is declared nowhere else, and taken in by the navbar alone', () => {
    const files = sources()
    // The fixture proves itself: a walk that found nothing would hold everything below.
    expect(files.length).toBeGreaterThan(300)
    expect(files).toContain('assets/fonts/afacad/afacad.css')
    expect(files).toContain('components/Menu/Navbar.vue')

    const declaring = files.filter((file) =>
      /@font-face\s*\{[^}]*font-family:\s*['"]?Afacad/i.test(live(read(file))),
    )
    expect(declaring).toEqual(['assets/fonts/afacad/afacad.css'])

    const importing = files.filter((file) =>
      /^import '@\/assets\/fonts\/afacad\/afacad\.css'$/m.test(read(file)),
    )
    expect(importing).toEqual(['components/Menu/Navbar.vue'])
  })
})
