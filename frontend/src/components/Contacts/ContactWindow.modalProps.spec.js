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

/**
 * The names written on one opening tag, as kebab-case names; `v-model` is `model-value`. A
 * listener keeps its `@` (`@shown`): it is held against the EVENTS the library declares, not its
 * props. An undeclared one is the same silent trap -- with `inheritAttrs: false` it lands on the
 * markup as a native listener for an event that never comes (V4a listens for `shown`).
 */
const namesOn = (tagBody) =>
  [...tagBody.matchAll(/(?:^|\s)(:|@)?([a-z][a-z0-9-]*)(?==|\s|$)/g)].map((m) =>
    m[2] === 'v-model' ? 'model-value' : m[1] === '@' ? `@${m[2]}` : m[2],
  )

/** What the installed BModal declares: its props and its events. */
const declaredProps = Object.keys(BModal.props ?? {})
const declaredEvents = [...(BModal.emits ?? [])]
const isDeclared = (name) =>
  name.startsWith('@')
    ? declaredEvents.includes(name.slice(1))
    : declaredProps.includes(camel(name))

/** Everything written on the window's `<BModal …>` opening tag -- the first in the file. */
const modalAttributes = () => {
  const tag = source.match(/<BModal\b([\s\S]*?)>/)
  expect(tag, 'ContactWindow no longer opens a BModal -- this guard needs rewriting').not.toBeNull()
  return namesOn(tag[1])
}

/**
 * Every `<BModal …>` opening tag in the file, the window's and the question before a video call
 * (V2) -- the comments taken out first, so a tag named in prose is not read as one.
 */
const allModalTags = () =>
  [...source.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<BModal\b([\s\S]*?)>/g)].map((m) =>
    namesOn(m[1]),
  )

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
    expect(declaredProps.length, 'could not read BModal props from the package').toBeGreaterThan(0)

    const unknown = modalAttributes()
      .filter((name) => !OURS.includes(name))
      .filter((name) => !name.startsWith('update:'))
      .filter((name) => !isDeclared(name))

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
   * ⛔ The sheet on a phone (E-031): below Bootstrap's `sm` the window covers the screen, the
   * compose bar at the bottom. The installed BModal turns a string into
   * `modal-fullscreen-${value}-down`, and the wallet's CSS has `.modal-fullscreen-sm-down`
   * under `(max-width: 575.98px)` -- so the VALUE is held here, not only the name, which the
   * first test holds against the package.
   */
  it('is a sheet below sm', () => {
    expect(modalAttributes()).toContain('fullscreen')
    expect(source.match(/<BModal\b[\s\S]*?>/)[0]).toMatch(/\sfullscreen="sm"/)
  })

  /**
   * ⛔ At the top, not in the middle: a centred window grows in both directions when the
   * thread lands, and what was under a finger moves (E-031).
   */
  it('sits at the top of the screen, not in the middle', () => {
    expect(modalAttributes()).not.toContain('centered')
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

  /**
   * The question before a video call (V2) is a second dialog in this file, and the same two
   * rules hold for it: only names the library declares, and a name of its own where it has no
   * header to be named by.
   */
  it('holds every dialog in the file to the names the library declares', () => {
    const OURS = ['data-test', 'body-class', 'class', 'aria-label']
    const tags = allModalTags()

    expect(tags, 'the window and the question before a call').toHaveLength(2)
    for (const written of tags) {
      const unknown = written
        .filter((name) => !OURS.includes(name))
        .filter((name) => !name.startsWith('update:'))
        .filter((name) => !isDeclared(name))
      expect(unknown).toEqual([])
    }
  })

  /**
   * V4a: the question waits for `shown` before it lets the topic field into the tab order
   * (ContactWindow, `videoAskOpened`). The event is the library's, so it is held here by the
   * name the package declares -- and a misspelt listener would be caught as an unknown name.
   */
  it('listens for an event the library declares, and it reads the events at all', () => {
    expect(declaredEvents, 'could not read BModal events from the package').toContain('shown')
    expect(allModalTags()[1]).toContain('@shown')
    expect(isDeclared('@shwon')).toBe(false)
  })

  it('names every dialog that has no header', () => {
    const headless = allModalTags().filter((written) => written.includes('no-header'))

    expect(headless).toHaveLength(2)
    for (const written of headless) expect(written).toContain('aria-label')
  })
})
