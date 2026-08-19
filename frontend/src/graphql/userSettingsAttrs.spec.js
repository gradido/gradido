// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// UserSettingsSwitch and UserNamingFormat send `{ [attrName]: value }` blind -- whatever
// name the page hands them goes into the variables of updateUserInfos. But a GraphQL
// document only carries the variables it declares: an undeclared one is dropped on the
// way out, silently and without an error. The switch still flips, still says "saved",
// and changes nothing.
//
// No component test can see this. They mock the mutation, so they receive whatever the
// component passes -- the layer that would have dropped it is the one that was replaced.
// So this compares the two files against each other: every attr-name a page hands to
// those components has to be declared in the mutation the components actually send.
//
// Path handling deliberately goes through fileURLToPath: jsdom brings its own URL class,
// and node rejects an instance of it as coming from a foreign realm.

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

describe('updateUserInfos variables', () => {
  it('declares every attr-name the settings pages hand to the self-saving components', () => {
    const declared = [...read('./mutations.js').matchAll(/\$(\w+):/g)].map((match) => match[1])
    const passedThrough = [...read('./mutations.js').matchAll(/^\s*(\w+): \$(\w+)$/gm)].map(
      (match) => match[1],
    )

    const pages = ['../pages/Settings.vue', '../pages/Matching.vue']
    const handedOver = pages.flatMap((page) =>
      [...read(page).matchAll(/attr-name="'?(\w+)'?"/g)].map((match) => match[1]),
    )

    expect(handedOver.length).toBeGreaterThan(0)
    // Declared as a variable of the document...
    expect(declared).toEqual(expect.arrayContaining(handedOver))
    // ...and handed on to the mutation itself. Declaring alone changes nothing.
    expect(passedThrough).toEqual(expect.arrayContaining(handedOver))
  })
})
