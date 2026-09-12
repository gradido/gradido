// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// A field the thread reads off a message but never asks for arrives as `undefined`, and
// every reader downstream treats that as "this author shows no picture": the circle keeps
// its letters, nothing crashes, no test fails -- because the tests hand the components a
// made-up message. That is exactly how a field was once added to the query nobody uses
// (#3884-era balanceFields), and this holds the two files against each other instead.
//
// ⚠️ It reads `message.userX` in the components that draw the thread, not in the spec files
// beside them: a spec invents its messages and would happily "prove" a field nobody sends.

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

describe('contributionMessageFields', () => {
  it('asks for every field the thread reads off a message', () => {
    const readers =
      read('../components/ContributionMessages/ContributionMessagesListItem.vue') +
      read('../components/Contributions/ContributionList.vue')
    const fragment = read('./contributions.graphql').match(
      /fragment contributionMessageFields on ContributionMessage \{([^}]*)\}/,
    )[1]

    const requested = fragment
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
    const readOffTheMessage = [
      ...new Set([...readers.matchAll(/message\.(user\w+)/g)].map((match) => match[1])),
    ]

    // The search proves itself: the thread does read fields off its message.
    expect(readOffTheMessage.length).toBeGreaterThan(0)
    expect(requested).toEqual(expect.arrayContaining(readOffTheMessage))
  })
})
