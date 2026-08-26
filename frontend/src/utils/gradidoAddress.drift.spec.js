// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { ALIAS_MIN_CHARS } from '../../../shared/src/schema/user.schema'
import { publicAlias } from '../../../shared/src/helper/publicAlias'
import { memberAlias } from './gradidoAddress'

// What a member may be called in front of anybody else exists twice on purpose: in
// `shared`, because the backend answers with it, `core` writes it into the mails a third
// party reads and the federation carries it across a community border -- and here,
// because the wallet builds the printed address itself and has no dependency on `shared`.
// That boundary is deliberate, so the copy stays; what it must not do is drift.
//
// The consequence of drift is not cosmetic. Two of the callers PRINT -- the card and the
// cheque -- so a wallet that answers `host/u/ab` where every mail about the same member
// says `host/u/<uuid>` puts one of the two on paper, where it cannot be corrected. The
// module's own opening comment names exactly that as the reason it exists.
//
// So this spec runs the two implementations against each other. `publicAlias` is imported
// straight from `shared`; vitest transforms TypeScript on its own, the same way
// `avatarColorIndex.drift.spec.js` reaches into `backend`.

const ID = '3a2f6f1e-6c1a-4e1a-9d3e-2f1b7c8d9e01'

describe('memberAlias against the shared public-alias rule', () => {
  it('agrees on every length around the threshold', () => {
    for (let length = 0; length <= ALIAS_MIN_CHARS + 3; length++) {
      const alias = 'a'.repeat(length)
      expect(memberAlias(alias, ID)).toBe(publicAlias(alias, ID))
    }
  })

  it('agrees on the absent cases', () => {
    for (const alias of [null, undefined, '']) {
      expect(memberAlias(alias, ID)).toBe(publicAlias(alias, ID))
    }
  })

  // Blank is not a name however long it is, and it would HIDE the identifier that is
  // supposed to stand in for a missing one.
  it('agrees that blank space is not a name', () => {
    for (const alias of ['   ', ' \t\n ', ' ab ', ' abc ']) {
      expect(memberAlias(alias, ID)).toBe(publicAlias(alias, ID))
    }
  })

  it('agrees on names people actually pick', () => {
    for (const alias of ['bernd', 'BerndH', 'bibi_bloxberg', 'a-team', 'a_b', 'x1']) {
      expect(memberAlias(alias, ID)).toBe(publicAlias(alias, ID))
    }
  })

  /**
   * ⚠️ The one place the two are allowed to differ, and it is the wallet being stricter
   * about its own crash than `shared` needs to be: with NEITHER value, `memberAlias` must
   * return the empty string rather than `undefined`, because the word "undefined" once
   * reached a printed cheque. `publicAlias` types `gradidoID` as required and ends in the
   * same `|| ''` belt, so in practice they agree here too -- asserted rather than assumed.
   */
  it('agrees that a member with neither value is named nothing at all', () => {
    expect(memberAlias(undefined, undefined)).toBe('')
    expect(publicAlias(undefined, undefined)).toBe('')
    expect(memberAlias(null, null)).toBe('')
  })
})
