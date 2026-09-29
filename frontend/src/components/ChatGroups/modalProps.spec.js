// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { BModal } from 'bootstrap-vue-next'

/**
 * Every `<BModal …>` of the group windows (P5), held against the installed component: its props
 * and its events. ⛔ The trap is silent -- an unknown name lands on the markup as a plain attribute
 * (BModal sets `inheritAttrs: false`) and does nothing; `hide-header` gave the contact window an
 * empty header bar once (ContactWindow.modalProps.spec.js, the same guard for that window).
 */
const here = dirname(fileURLToPath(import.meta.url))
const FILES = readdirSync(here).filter((name) => name.endsWith('.vue'))

const camel = (name) => name.replace(/-([a-z])/g, (unused, letter) => letter.toUpperCase())

/** The names on one opening tag, kebab-case; `v-model` is `model-value`, a listener keeps `@`. */
const namesOn = (tagBody) =>
  [...tagBody.matchAll(/(?:^|\s)(:|@)?([a-z][a-z0-9-]*)(?==|\s|$)/g)].map((m) =>
    m[2] === 'v-model' ? 'model-value' : m[1] === '@' ? `@${m[2]}` : m[2],
  )

const declaredProps = Object.keys(BModal.props ?? {})
const declaredEvents = [...(BModal.emits ?? [])]

/** Ours rather than the component's, and measured to pass through (ContactWindow's guard). */
const OURS = ['data-test', 'body-class', 'class', 'aria-label']

describe('the group windows and the modals they open', () => {
  it('have windows to hold', () => {
    expect(FILES).toContain('ChatGroupWindow.vue')
    expect(declaredProps.length, 'could not read BModal props from the package').toBeGreaterThan(0)
  })

  it('use only names the installed BModal declares', () => {
    const unknown = []
    for (const file of FILES) {
      const source = readFileSync(join(here, file), 'utf8').replace(/<!--[\s\S]*?-->/g, '')
      for (const [, tag] of source.matchAll(/<BModal\b([\s\S]*?)>/g)) {
        for (const name of namesOn(tag)) {
          const known = name.startsWith('@')
            ? declaredEvents.includes(name.slice(1))
            : declaredProps.includes(camel(name)) || OURS.includes(name)
          if (!known) unknown.push(`${file}: ${name}`)
        }
      }
    }
    expect(unknown).toEqual([])
  })

  // Gegenprobe: the reader would see the old names.
  it('would notice a name the library does not have', () => {
    expect(declaredProps).not.toContain(camel('hide-footer'))
    expect(namesOn(' hide-footer no-header :aria-label="x"')).toEqual([
      'hide-footer',
      'no-header',
      'aria-label',
    ])
  })
})
