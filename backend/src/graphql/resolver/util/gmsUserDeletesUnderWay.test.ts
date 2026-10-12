// AI-GENERATED — not an architecture reference
import { endUserDeleteUnderWay, noteUserDeleteUnderWay } from './gmsUserDeletesUnderWay'

describe('deletes of a member in the GMS that are being tried again', () => {
  it('are wanted until the member is handed over again', () => {
    const first = noteUserDeleteUnderWay(1)
    expect(first.stillWanted()).toBe(true)

    endUserDeleteUnderWay(1)
    expect(first.stillWanted()).toBe(false)
  })

  it('are told apart by member', () => {
    const ofOne = noteUserDeleteUnderWay(2)
    const ofAnother = noteUserDeleteUnderWay(3)

    endUserDeleteUnderWay(2)
    expect(ofOne.stillWanted()).toBe(false)
    expect(ofAnother.stillWanted()).toBe(true)
    endUserDeleteUnderWay(3)
  })

  // A member who is taken off, handed over and taken off again within the minute.
  it('are replaced by a later delete of the same member', () => {
    const earlier = noteUserDeleteUnderWay(4)
    const later = noteUserDeleteUnderWay(4)

    expect(earlier.stillWanted()).toBe(false)
    expect(later.stillWanted()).toBe(true)
    endUserDeleteUnderWay(4)
  })

  // The tries of an earlier delete end while a later one is under way: its end must not take
  // the later one with it.
  it('end without touching a later delete of the same member', () => {
    const earlier = noteUserDeleteUnderWay(5)
    const later = noteUserDeleteUnderWay(5)

    earlier.over()
    expect(later.stillWanted()).toBe(true)

    later.over()
    expect(later.stillWanted()).toBe(false)
  })

  it('are nothing to end for a member who has none', () => {
    expect(() => endUserDeleteUnderWay(6)).not.toThrow()
  })
})
