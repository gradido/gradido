// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Everything the two readers of this document take off the answer, held against what the
 * document asks for -- the same guard `balanceFields.spec.js` makes over the balance, and
 * for the same failure.
 *
 * A field that is read but not asked for comes back `undefined`, and nothing here says so:
 * both specs hand their component a made-up answer, so the mocked layer always has the
 * field. Measured on this very delivery: with `gradidoID` taken back out of the document,
 * all fourteen tests over the tile and the overview stayed green -- while at the device the
 * tap on the name would do nothing at all, because `openMember` leaves on a missing one.
 *
 * ⛔ Comments come out first. Both files explain in prose what they read (`gradidoID` is
 * named three times in the tile's own comments), so a search over the raw text would find
 * its own explanation and survive the deletion of the code. The check below that the
 * stripped source still carries the one line this delivery stands on is what says the
 * stripper took the comments and not the file.
 */
const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

/** Line and block comments, and the HTML kind a Vue template uses. */
const withoutComments = (source) =>
  source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

describe('showFriends', () => {
  it('asks for every field its readers take off the answer', () => {
    const tile = withoutComments(read('../components/Overview/ShowFriendsTile.vue'))
    const firstCreation = withoutComments(read('../components/FirstCreation.vue'))
    const document = read('./showFriends.graphql')

    // The stripper took the comments, not the file: this is the line the whole delivery
    // stands on, and it is code.
    expect(tile).toContain('arrival.value.gradidoID')

    const asked = document.match(/latestArrival \{([^}]*)\}/)[1]
    const arrivalFields = asked
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))

    // `(?!value)` so the ref's own `.value` -- `if (!arrival.value) return` -- is not
    // read as a field of the answer.
    const readOffTheArrival = [...tile.matchAll(/arrival(?:\.value)?\.(?!value)(\w+)/g)].map(
      (m) => m[1],
    )
    expect(readOffTheArrival.length).toBeGreaterThan(0)
    expect(arrivalFields).toEqual(expect.arrayContaining(readOffTheArrival))

    // The other half of the answer, read in the other file.
    const readOffShowFriends = [
      ...firstCreation.matchAll(/friendsResult\.value\?\.showFriends\?\.(\w+)/g),
    ].map((m) => m[1])
    expect(readOffShowFriends.length).toBeGreaterThan(0)
    for (const field of readOffShowFriends) {
      expect(document).toContain(field)
    }
  })
})
