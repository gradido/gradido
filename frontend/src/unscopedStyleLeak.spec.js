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
 */
const here = dirname(fileURLToPath(import.meta.url))
const ROOTS = ['components', 'layouts', 'pages']

const vueFiles = (dir) => {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...vueFiles(full))
    else if (entry.endsWith('.vue')) out.push(full)
  }
  return out
}

const files = ROOTS.flatMap((r) => vueFiles(join(here, r)))

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

describe('unscoped styles that take an element out of the flow', () => {
  const sources = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]))

  it('reads the components it is about to measure', () => {
    // The fixture proves itself: an empty sweep would make the assertion below pass by
    // describing nothing.
    expect(files.length).toBeGreaterThan(50)
    expect(files.some((f) => basename(f) === 'AvatarZoom.vue')).toBe(true)
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

    const collisions = []
    for (const [name, declaring] of owners) {
      for (const [file, source] of sources) {
        if (declaring.has(file)) continue
        if (templateClasses(source).has(name)) {
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
