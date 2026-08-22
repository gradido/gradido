// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// What makes the wallet installable is spread over four places that cannot import each
// other: index.html, the manifest in public/, the icon files, and the nginx template that
// serves them. Nothing here runs in a test, so nothing here fails loudly -- a wrong
// start_url just shows the sign-in form forever, a transparent icon just turns black on the
// home screen, and a renamed manifest just stops being fetched. So the files are held
// against each other instead.

// fileURLToPath is handed the string import.meta.url, never a URL object built here. The
// test environment brings its own URL class, and node rejects an instance of it as coming
// from the wrong realm -- which passes locally and fails in CI.
const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')
const readBytes = (relativePath) => readFileSync(resolve(here, relativePath))

const indexHtml = read('../index.html')
const manifest = JSON.parse(read('../public/manifest.webmanifest'))

// A PNG says what it carries in its IHDR: 8 bytes signature, 4 length, 4 "IHDR", then
// width, height and the colour type. Bit 2 of the colour type is the alpha channel
// (4 = grey+alpha, 6 = truecolour+alpha); indexed images carry transparency in a tRNS
// chunk instead. Reading it costs nothing and needs no image library.
const readPng = (publicPath) => {
  const bytes = readBytes(`../public${publicPath}`)
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    hasAlphaChannel: (bytes[25] & 4) !== 0,
    hasTransparencyChunk: bytes.includes(Buffer.from('tRNS')),
  }
}

// The --bg token, from the file that owns it. `\s` rather than a literal space so a
// reformat of the stylesheet does not read as a colour change.
const tokenBg = (scss, selector) =>
  read(scss)
    .slice(read(scss).indexOf(selector))
    .match(/--bg:\s*(#[0-9a-f]{3,8})/i)[1]

describe('web app manifest', () => {
  // "/" redirects to /login, and Login.vue does not check for an existing token -- so with
  // start_url "/" the installed app shows the sign-in form on EVERY launch, even with a live
  // session. /overview hands the decision to the router guard, which gets it right both ways.
  it('starts at the overview, never at the root', () => {
    expect(manifest.start_url).toBe('/overview')
  })

  it('is installable: display, scope and the two icon sizes browsers ask for', () => {
    expect(manifest.display).toBe('standalone')
    expect(manifest.scope).toBe('/')
    expect(manifest.icons.map((icon) => icon.sizes).sort()).toEqual(['192x192', '512x512'])
  })

  it('names icons that are really there, at the size it claims', () => {
    expect(manifest.icons.length).toBeGreaterThan(0)
    for (const icon of manifest.icons) {
      const [width, height] = icon.sizes.split('x').map(Number)
      expect({ src: icon.src, ...readPng(icon.src) }).toMatchObject({ width, height })
    }
  })
})

describe('home screen icons', () => {
  const appleTouchIcon = indexHtml.match(/<link rel="apple-touch-icon" href="([^"]+)"/)[1]
  const everyIcon = [appleTouchIcon, ...manifest.icons.map((icon) => icon.src)]

  // iOS composites transparency onto BLACK and then applies its rounded mask. The Gradido
  // coin is round and comes with an alpha channel, so an icon made straight from it gets
  // black corners. The background is baked in (#f5f5f5, the page colour) and the coin is
  // inset by a tenth so the mask does not clip its rim.
  it('carries no transparency, or iOS would fill it with black', () => {
    expect(everyIcon.length).toBe(3)
    for (const src of everyIcon) {
      const png = readPng(src)
      expect({ src, alpha: png.hasAlphaChannel, tRNS: png.hasTransparencyChunk }).toEqual({
        src,
        alpha: false,
        tRNS: false,
      })
    }
  })

  it('gives iOS the 180px icon it asks for', () => {
    expect(readPng(appleTouchIcon)).toMatchObject({ width: 180, height: 180 })
  })
})

describe('theme-color', () => {
  // Installed on a home screen this colour IS the status bar, so it has to be the page
  // background and not something near it. index.html has to spell both values out because it
  // runs before any stylesheet; App.vue reads the live token instead. These two are the ones
  // that can drift.
  const metaThemeColor = indexHtml.match(/<meta name="theme-color" content="([^"]+)"/)[1]
  const darkInBootScript = indexHtml.match(/themeMeta\.setAttribute\('content', '([^']+)'\)/)[1]

  it('matches the light --bg token', () => {
    expect(metaThemeColor).toBe(tokenBg('./assets/scss/_design-tokens.scss', ':root'))
  })

  it('matches the dark --bg token before first paint', () => {
    expect(darkInBootScript).toBe(
      tokenBg('./assets/scss/gradido-template-dark.scss', 'body.dark-mode'),
    )
  })
})

describe('how the manifest is served', () => {
  // Three names have to agree that no build step checks: the href in index.html, the file in
  // public/, and the exact location in the nginx templates. That location is what gives the
  // file its content type -- nginx 1.22 has no entry for .webmanifest -- and what keeps it
  // out of the one-year immutable bucket that every .json here falls into. Get the name
  // wrong in one of the three and the manifest is either not found, served as the wrong
  // type, or frozen for a year on every device that already installed the app.
  const href = indexHtml.match(/<link rel="manifest" href="([^"]+)"/)[1]

  it('links the file that is actually in public/', () => {
    expect(href).toBe('/manifest.webmanifest')
    expect(() => read(`../public${href}`)).not.toThrow()
  })

  for (const template of ['gradido.conf.template', 'gradido.conf.ssl.template']) {
    it(`has its own location in ${template}`, () => {
      const conf = read(`../../deployment/bare_metal/nginx/sites-available/${template}`)
      expect(conf).toContain(`location = ${href} {`)
      expect(conf).toContain('default_type application/manifest+json;')
    })
  }
})
