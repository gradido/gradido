// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { avatarColorIndex } from '../../../backend/src/data/AvatarColor.logic'
import { AVATAR_COLOR_PALETTE, avatarPaletteEntry } from './avatarColor'
import { avatarLettering } from './avatarLettering'

// The colour rule exists twice on purpose: here, because the printed card draws it on a
// canvas -- and in backend/src/data/AvatarColor.logic.ts, because the server sends the
// finished index for members whose names this browser no longer receives (NU-017). What
// the copies must not do is drift: a member whose circle is blue today must not turn
// brown the day the index starts coming from the server (AS-010).
//
// So this spec runs the two implementations against each other, over the whole chain
// the wallet actually uses: avatarLettering builds the seed, avatarPaletteEntry hashes
// it -- and the backend, fed the same names, must land on the same palette entry.
//
// The backend file is imported directly. It is dependency-free by design, and vitest
// transforms TypeScript on its own; a copy of it here would need a drift test of its
// own.

// What the wallet answers today, as an index: the palette entry the seed hashes to.
// indexOf works on identity -- avatarPaletteEntry returns the entry object itself.
const walletIndex = (firstName, lastName) =>
  AVATAR_COLOR_PALETTE.indexOf(
    avatarPaletteEntry(avatarLettering({ firstName, lastName }).colorSeed),
  )

describe('avatarColorIndex against the wallet colour rule', () => {
  it('agrees with the wallet for every pair of first characters', () => {
    // One character per name is enough to cover the hash: the seed is built from first
    // characters only. Umlauts and a non-Latin pair guard the UTF-16 behaviour.
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÄÖÜäöüß0123456789名'
    for (const first of alphabet) {
      for (const last of alphabet) {
        expect(avatarColorIndex(first, last)).toBe(walletIndex(first, last))
      }
    }
  })

  it('agrees with the wallet for full names, absent names, and empty names', () => {
    const cases = [
      ['Bernd', 'Hueckstaedt'],
      ['bernd', 'hueckstaedt'],
      ['van Dijk', 'de la Cruz'],
      ['Özil', 'Xaver'],
      ['名', '字'],
      ['', ''],
      [null, null],
      [undefined, undefined],
      ['Bernd', null],
      [null, 'Hueckstaedt'],
      ['X', ''],
    ]
    for (const [firstName, lastName] of cases) {
      expect(avatarColorIndex(firstName, lastName)).toBe(walletIndex(firstName, lastName))
    }
  })

  // Pinned against the same colours frontend/src/utils/avatarColor.spec.js pins, so a
  // change that moves BOTH implementations in step still fails somewhere: agreement
  // alone cannot tell "unchanged" from "changed together".
  it('still lands on the colours that are already printed on cards', () => {
    expect(AVATAR_COLOR_PALETTE[avatarColorIndex('Bernd', 'Hueckstaedt')].bg).toBe('#2B6CB0')
    expect(AVATAR_COLOR_PALETTE[avatarColorIndex('Anna', 'Aal')].bg).toBe('#4A5568')
    expect(AVATAR_COLOR_PALETTE[avatarColorIndex('Maria', 'Kaiser')].bg).toBe('#805AD5')
  })
})
