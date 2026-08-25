// AI-GENERATED — not an architecture reference

import { avatarColorIndex } from './AvatarColor.logic'

// The full backend-against-frontend comparison lives on the wallet side
// (frontend/src/utils/avatarColorIndex.drift.spec.js), where both implementations can
// be loaded. What is pinned here are known values, so a change to the hash fails in
// this package too — next to the file that changed.
describe('avatarColorIndex', () => {
  // The same three pairs frontend/src/utils/avatarColor.spec.js pins as colours:
  // index 8 is #2B6CB0, 0 is #4A5568, 2 is #805AD5. A circle colour is printed on
  // cards members hand out and cannot take back, so it has to fail here first.
  it('keeps the indexes the wallet has always computed', () => {
    expect(avatarColorIndex('Bernd', 'Hueckstaedt')).toBe(8)
    expect(avatarColorIndex('Anna', 'Aal')).toBe(0)
    expect(avatarColorIndex('Maria', 'Kaiser')).toBe(2)
  })

  // Raw case, as the wallet hashes it: the uppercasing a member sees is CSS.
  it('is case-sensitive like the wallet hash', () => {
    expect(avatarColorIndex('bernd', 'hueckstaedt')).toBe(2)
    expect(avatarColorIndex('bernd', 'hueckstaedt')).not.toBe(
      avatarColorIndex('Bernd', 'Hueckstaedt'),
    )
  })

  it('answers for absent and partial names, like the wallet does for foreign rows', () => {
    expect(avatarColorIndex(null, null)).toBe(0)
    expect(avatarColorIndex('', '')).toBe(0)
    expect(avatarColorIndex(undefined, undefined)).toBe(0)
    expect(avatarColorIndex('Bernd', null)).toBe(6)
    expect(avatarColorIndex(null, 'Hueckstaedt')).toBe(2)
  })

  it('handles non-ASCII first characters as UTF-16 code units', () => {
    expect(avatarColorIndex('Özil', 'Xaver')).toBe(2)
    expect(avatarColorIndex('ätna', 'ölberg')).toBe(4)
  })

  it('always lands inside the ten-entry palette', () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÄÖÜäöüß0123456789'
    for (const first of alphabet) {
      for (const last of alphabet) {
        const index = avatarColorIndex(first, last)
        expect(index).toBeGreaterThanOrEqual(0)
        expect(index).toBeLessThan(10)
        expect(Number.isInteger(index)).toBe(true)
      }
    }
  })
})
