// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// A field the dashboard reads off the balance but never asks for comes back undefined, and
// the `|| 0` right next to it turns that into a number that looks like an answer. Nothing
// crashes, no test fails - the tests hand the layout a made-up response - and the screen
// quietly shows zero. That is how openLinkCount was added to the wrong query and still
// looked finished.
//
// So this compares the files against each other: everything read from tr.balance -- in the
// layout (balance, balanceGDT) and on the transactions page (the count of its own list and
// the account-wide link counts) -- has to appear in the fragment both queries send.

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

describe('balanceFields', () => {
  it('asks for every field the dashboard reads off the balance', () => {
    const layout = read('../layouts/DashboardLayout.vue') + read('../pages/Transactions.vue')
    const fragment = read('./transactions.graphql').match(
      /fragment balanceFields on Balance \{([^}]*)\}/,
    )[1]

    const requested = fragment
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const readOffTheBalance = [...layout.matchAll(/balance\?\.(\w+)/g)].map((match) => match[1])

    expect(readOffTheBalance.length).toBeGreaterThan(0)
    expect(requested).toEqual(expect.arrayContaining(readOffTheBalance))
  })
})
