// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, basename } from 'node:path'

/**
 * ⛔ An unscoped `<style>` block styles the WHOLE wallet, and this is what that costs when
 * two components pick the same class name.
 *
 * `AvatarZoom.vue` named its full-screen overlay `.avatar-zoom` and left its styles
 * unscoped. `AvatarCropper.vue` had long named the size-slider row `.avatar-zoom` too. So
 * the cropper's row silently inherited `position: fixed; inset: 0; z-index: 2000`: the
 * slider stretched across the whole window, and the invisible rest of that sheet lay over
 * everything at a z-index above the modal's, swallowing every click. The wallet looked
 * frozen and only a reload brought it back. Live from 30.08.2026 to 03.09.2026, found only
 * because someone opened the cropper -- the one door to it.
 *
 * ⚠️ The two rules never fought. The scoped one set `display`/`color`/`gap`, the global one
 * `position`/`inset`/`z-index` -- disjoint, so both applied and neither overrode the other.
 * Nothing looked wrong in either file.
 *
 * ⚠️ This does NOT demand that every style block be scoped: 21 are not, and most of that is
 * deliberate -- `.btn`, `.active`, `.alert`, `.breadcrumb` are Bootstrap surfaces this
 * wallet means to repaint everywhere. Sharing a PAINT is a decision. What is never a
 * decision is one component taking another's element OUT OF THE DOCUMENT FLOW, which is
 * the narrow thing measured here.
 *
 * ⚠️ The components are .tsx files now, and the two halves of the measurement moved with them.
 * What a `scoped` block was is a style module (`X.module.scss`), whose rules hang on a hashed
 * class and reach nobody else -- AvatarZoom's sheet is one, and stays one. What an unscoped
 * block was is a plain sheet a component imports for its effect (`X.css`, `X.scss`): that is
 * the block measured here, owned by the component of its name. And a class is worn where the
 * markup says `class='…'` or names it inside `class={…}`. A .vue file that is still there is
 * read as it always was.
 */
const here = dirname(fileURLToPath(import.meta.url))
const ROOTS = ['components', 'layouts', 'pages']

const walk = (dir, wanted) => {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full, wanted))
    else if (wanted(entry)) out.push(full)
  }
  return out
}

const files = ROOTS.flatMap((r) =>
  walk(join(here, r), (entry) => entry.endsWith('.vue') || entry.endsWith('.tsx')),
)

/** The plain sheets: global, as an unscoped block was. A style module is not one of them. */
const globalSheets = ROOTS.flatMap((r) =>
  walk(join(here, r), (entry) => /\.s?css$/.test(entry) && !/\.module\.s?css$/.test(entry)),
)

/** The component a plain sheet belongs to: the .tsx of its name, where there is one. */
const ownerOf = (sheet) => {
  const component = sheet.replace(/\.s?css$/, '.tsx')
  return files.includes(component) ? component : sheet
}

const unscopedBlocks = (source) =>
  [...source.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)]
    .filter(([, attrs]) => !/\bscoped\b|\bmodule\b/.test(attrs))
    .map(([, , css]) => css)

/** Class names an unscoped rule takes out of the flow. */
const escapingClasses = (css) => {
  const found = new Set()
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/position\s*:\s*(fixed|absolute|sticky)/.test(body)) continue
    for (const [, name] of selector.matchAll(/\.([a-zA-Z][\w-]*)/g)) found.add(name)
  }
  return found
}

const templateClasses = (source) => {
  const template = source.match(/<template>([\s\S]*)<\/template>/)
  if (!template) return new Set()
  const found = new Set()
  for (const [, list] of template[1].matchAll(/(?<!:)\bclass="([^"]*)"/g)) {
    for (const name of list.split(/\s+/)) if (name) found.add(name)
  }
  /**
   * ⛔ And the bound form. `:class="{ 'avatar-zoom': enabled }"` puts the very same name on
   * the very same element, and a matcher that read only the static attribute would report
   * a clean tree while the leak was live -- the guard would describe nothing.
   * (coderabbit, PR #3838.) Quoted literals are what can be read statically; a name
   * computed at runtime cannot be, and this makes no claim to catch that.
   */
  for (const [, expression] of template[1].matchAll(/(?::|v-bind:)class="([^"]*)"/g)) {
    for (const [, name] of expression.matchAll(/['`]([a-zA-Z][\w-]*)['`]/g)) found.add(name)
  }
  return found
}

/**
 * The same two readings for a .tsx file: the static `class='a b'`, and every quoted name inside
 * a `class={…}` expression -- an array, an object's keys, a condition's two sides. A name read
 * off a style module (`classes.x`) is hashed and nobody else's; it is no quoted literal and is
 * not collected.
 */
const tsxClasses = (source) => {
  const found = new Set()
  const add = (list) => {
    for (const name of list.split(/\s+/)) if (/^[a-zA-Z][\w-]*$/.test(name)) found.add(name)
  }
  for (const match of source.matchAll(/\bclass=(['"{])/g)) {
    const start = match.index + match[0].length
    if (match[1] !== '{') {
      add(source.slice(start, source.indexOf(match[1], start)))
      continue
    }
    let depth = 1
    let end = start
    while (depth > 0 && end < source.length) {
      if (source[end] === '{') depth++
      if (source[end] === '}') depth--
      end++
    }
    for (const [, list] of source.slice(start, end).matchAll(/['"`]([^'"`]*)['"`]/g)) add(list)
  }
  return found
}

const wornClasses = (file, source) =>
  file.endsWith('.tsx') ? tsxClasses(source) : templateClasses(source)

describe('unscoped styles that take an element out of the flow', () => {
  const sources = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]))

  it('reads the components it is about to measure', () => {
    // The fixture proves itself: an empty sweep would make the assertion below pass by
    // describing nothing.
    expect(files.length).toBeGreaterThan(50)
    expect(files.some((f) => basename(f) === 'AvatarZoom.tsx')).toBe(true)
    expect(globalSheets.length).toBeGreaterThan(10)
    // ...and the reading of a .tsx file finds what the two files of the incident wear.
    const worn = (name) => tsxClasses(readFileSync(join(here, 'components/Avatar', name), 'utf8'))
    expect(worn('AvatarZoom.tsx').has('avatar-zoom')).toBe(true)
    expect(worn('AvatarZoom.tsx').has('is-closing')).toBe(true)
    expect(worn('AvatarCropper.tsx').has('avatar-size')).toBe(true)
  })

  it('claims no class name another component puts on its own elements', () => {
    const owners = new Map()
    for (const [file, source] of sources) {
      for (const css of unscopedBlocks(source)) {
        for (const name of escapingClasses(css)) {
          if (!owners.has(name)) owners.set(name, new Set())
          owners.get(name).add(file)
        }
      }
    }
    for (const sheet of globalSheets) {
      for (const name of escapingClasses(readFileSync(sheet, 'utf8'))) {
        if (!owners.has(name)) owners.set(name, new Set())
        owners.get(name).add(ownerOf(sheet))
      }
    }

    const collisions = []
    for (const [name, declaring] of owners) {
      for (const [file, source] of sources) {
        if (declaring.has(file)) continue
        if (wornClasses(file, source).has(name)) {
          collisions.push(
            `.${name}: positioned unscoped by ` +
              `${[...declaring].map((f) => relative(here, f)).join(', ')}, ` +
              `worn by ${relative(here, file)}`,
          )
        }
      }
    }

    expect(collisions).toEqual([])
  })
})
