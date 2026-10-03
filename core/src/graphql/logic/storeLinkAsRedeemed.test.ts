// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import * as database from 'database'
import { storeLinkAsRedeemed } from './storeLinkAsRedeemed'

// ⛔ spyOn, not mock.module: Bun cannot restore a module mock (see ChatMessage.logic.test.ts).

const CODE = 'a1f9c2d41b7e19981fa0d001'
const ACCEPTED_AT = new Date('2026-10-03T16:30:00.000Z')

const link = () =>
  ({ id: 7, code: CODE, redeemedBy: null, redeemedAt: null }) as unknown as database.TransactionLink
const memberFromAfar = { id: 815 } as unknown as database.User

let spies: { mockRestore: () => void }[] = []
afterEach(() => {
  for (const spy of spies) {
    spy.mockRestore()
  }
  spies = []
})

/**
 * A link accepted from another community: the mark is written, and the large rendition of a
 * greeting's own picture goes -- as it does where a member of this community accepts
 * (redeemTransactionLink).
 */
describe('storeLinkAsRedeemed', () => {
  it('marks the link as accepted by the mirror row of the member from afar', async () => {
    const save = spyOn(database.TransactionLink, 'save').mockImplementation(
      (async (entity: unknown) => entity) as never,
    )
    spies.push(save)
    spies.push(spyOn(database, 'dbDeleteThankYouGreetingPicturesByLinkCode').mockResolvedValue(0))
    const accepted = link()

    expect(await storeLinkAsRedeemed(accepted, memberFromAfar, ACCEPTED_AT)).toBe(true)

    expect(accepted.redeemedBy).toBe(815)
    expect(accepted.redeemedAt).toBe(ACCEPTED_AT)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('takes the large rendition of the greeting’s picture out, after the mark is written', async () => {
    const order: string[] = []
    spies.push(
      spyOn(database.TransactionLink, 'save').mockImplementation((async (entity: unknown) => {
        order.push('mark')
        return entity
      }) as never),
    )
    const remove = spyOn(database, 'dbDeleteThankYouGreetingPicturesByLinkCode').mockImplementation(
      async () => {
        order.push('picture')
        return 1
      },
    )
    spies.push(remove)

    expect(await storeLinkAsRedeemed(link(), memberFromAfar, ACCEPTED_AT)).toBe(true)

    expect(order).toEqual(['mark', 'picture'])
    // The large one alone: the small one stays with the booking.
    expect(remove).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith(CODE, 'large')
  })

  it('leaves the picture where the mark could not be written', async () => {
    spies.push(
      spyOn(database.TransactionLink, 'save').mockRejectedValue(
        new Error('the link table is away'),
      ),
    )
    const remove = spyOn(database, 'dbDeleteThankYouGreetingPicturesByLinkCode').mockResolvedValue(
      1,
    )
    spies.push(remove)

    expect(await storeLinkAsRedeemed(link(), memberFromAfar, ACCEPTED_AT)).toBe(false)

    expect(remove).not.toHaveBeenCalled()
  })

  // A picture that cannot be taken out neither undoes the acceptance nor reports it as failed.
  it('says the link is accepted even where the picture could not be taken out', async () => {
    spies.push(
      spyOn(database.TransactionLink, 'save').mockImplementation(
        (async (entity: unknown) => entity) as never,
      ),
    )
    spies.push(
      spyOn(database, 'dbDeleteThankYouGreetingPicturesByLinkCode').mockRejectedValue(
        Object.assign(new Error('Failed query'), { cause: { code: 'ECONNRESET' } }),
      ),
    )

    expect(await storeLinkAsRedeemed(link(), memberFromAfar, ACCEPTED_AT)).toBe(true)
  })
})
