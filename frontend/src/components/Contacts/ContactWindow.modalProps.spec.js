// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { BModal } from 'bootstrap-vue-next'

/**
 * ⛔ The trap this holds is silent in both directions.
 *
 * bootstrap-vue-next renamed bootstrap-vue's `hide-*` modal props to `no-*`. The old names
 * are not rejected -- `BModal` sets `inheritAttrs: false`, so an unknown one simply lands on
 * the markup as a plain attribute and does nothing. The contact window asked for
 * `hide-header` and `hide-footer` and got a window with an empty header bar and an
 * untranslated Cancel / OK pair under its own two buttons. Nothing was red, and no ordinary
 * spec could see it: they all stub the modal.
 *
 * So this compares the SOURCE against the installed component's declared props rather than
 * against a list written from memory -- the same shape as the other drift specs in this
 * tree. If the library renames them again, this fails on the day the package moves.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class and node rejects
 * an instance of it as coming from another realm.
 */
const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'ContactWindow.vue'),
  'utf8',
)

/** Everything written on the `<BModal …>` opening tag, as kebab-case names. */
const modalAttributes = () => {
  const tag = source.match(/<BModal\b([\s\S]*?)>/)
  expect(tag, 'ContactWindow no longer opens a BModal -- this guard needs rewriting').not.toBeNull()
  return [...tag[1].matchAll(/(?:^|\s)(?::|@)?([a-z][a-z0-9-]*)(?==|\s|$)/g)].map((m) => m[1])
}

const camel = (name) => name.replace(/-([a-z])/g, (unused, letter) => letter.toUpperCase())

describe('ContactWindow and the modal it opens', () => {
  it('uses only prop names the installed BModal declares', () => {
    /**
     * Attributes that are ours rather than the component's, and legitimately pass through.
     *
     * ⚠️ `aria-label` is on this list because it is MEASURED to arrive where it must: the
     * dialog root is built as `mergeProps({ role: "dialog", "aria-labelledby": … }, $attrs,
     * …)`, so an ARIA attribute written here lands on the element carrying the role. That
     * is not true of every component with `inheritAttrs: false`, which is why it is written
     * down rather than assumed.
     */
    const OURS = ['data-test', 'body-class', 'class', 'aria-label']
    const declared = Object.keys(BModal.props ?? {})
    expect(declared.length, 'could not read BModal props from the package').toBeGreaterThan(0)

    const unknown = modalAttributes()
      .filter((name) => !OURS.includes(name))
      .filter((name) => !name.startsWith('update:'))
      .filter((name) => !declared.includes(camel(name)))

    expect(unknown).toEqual([])
  })

  /**
   * The two that were wrong, named so the failure says what to do rather than only that
   * something is off. `hide-header` is still written in five older files; those are their
   * own delivery, and this guard covers the window this delivery built.
   */
  it('says no header and no footer by the names the library knows', () => {
    const written = modalAttributes()

    expect(written).toContain('no-header')
    expect(written).toContain('no-footer')
    expect(written).not.toContain('hide-header')
    expect(written).not.toContain('hide-footer')
  })

  // Without it every closed dialog stays rendered and teleported to the body -- the rule
  // FavoriteHeart states beside its own confirmation.
  it('does not render itself while it is closed', () => {
    expect(modalAttributes()).toContain('lazy')
  })

  /**
   * ⛔ A dialog with no header labels itself by nothing: `aria-labelledby` is bound only
   * where a header exists. Dropping the header and stopping there left this window
   * announcing itself as "dialog" and no more, with the person's name only inside the body.
   * The two attributes belong together, and this is what says so.
   */
  it('names itself, since it has no header to be named by', () => {
    const written = modalAttributes()

    expect(written).toContain('no-header')
    expect(written).toContain('aria-label')
  })
})
