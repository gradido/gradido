// AI-GENERATED — not an architecture reference
import { ThankYouGreetingPictureInfo, ThankYouGreetingPicturesOfLink } from 'database'
import {
  hasFormOfLinkCode,
  mayAddLargePicture,
  PictureLinkState,
  pictureLinkIsAcceptedOrDeleted,
  pictureLinkIsOpen,
  pictureRenditionsForCodeHolder,
  pictureRenditionsForMember,
  pictureToServe,
} from './ThankYouGreetingPicture.logic'
import { linkVouches } from './VouchingLink.logic'

// Who is who: the member who made the link, the one who accepted it, and a third member who
// has nothing to do with it. Ids with nothing in common, so that none passes for another.
const SENDER = 4711
const ACCEPTER = 815
const THIRD = 2026

const NOW = new Date('2026-10-03T16:30:00.000Z')
const IN_A_WEEK = new Date('2026-10-10T16:30:00.000Z')
const YESTERDAY = new Date('2026-10-02T16:30:00.000Z')
const AN_HOUR_AGO = new Date('2026-10-03T15:30:00.000Z')

const open: PictureLinkState = {
  userId: SENDER,
  validUntil: IN_A_WEEK,
  redeemedAt: null,
  redeemedBy: null,
  deletedAt: null,
}
const runOut: PictureLinkState = { ...open, validUntil: YESTERDAY }
const accepted: PictureLinkState = { ...open, redeemedAt: AN_HOUR_AGO, redeemedBy: ACCEPTER }
const deleted: PictureLinkState = { ...open, deletedAt: AN_HOUR_AGO }
// What a state can also be: deleted after it ran out, and -- which deleteTransactionLink does
// not allow, but a row can say it -- deleted though accepted.
const runOutAndDeleted: PictureLinkState = { ...runOut, deletedAt: AN_HOUR_AGO }
const acceptedAndDeleted: PictureLinkState = { ...accepted, deletedAt: AN_HOUR_AGO }

const EVERY_STATE = { open, runOut, accepted, deleted, runOutAndDeleted, acceptedAndDeleted }

describe('pictureLinkIsOpen', () => {
  it('says yes for a link that is not deleted, not accepted and not run out', () => {
    expect(pictureLinkIsOpen(open, NOW)).toBe(true)
  })

  it('says no once the link is run out, accepted or deleted', () => {
    expect(pictureLinkIsOpen(runOut, NOW)).toBe(false)
    expect(pictureLinkIsOpen(accepted, NOW)).toBe(false)
    expect(pictureLinkIsOpen(deleted, NOW)).toBe(false)
  })

  // Each of the two columns alone says "accepted": a row holding one without the other is not
  // read as open.
  it('takes either mark of an acceptance alone', () => {
    expect(pictureLinkIsOpen({ ...open, redeemedAt: AN_HOUR_AGO }, NOW)).toBe(false)
    expect(pictureLinkIsOpen({ ...open, redeemedBy: ACCEPTER }, NOW)).toBe(false)
  })

  // The last moment a link can be accepted is the one that still shows its picture.
  it('is open at the very moment the link runs out, and closed a millisecond later', () => {
    expect(pictureLinkIsOpen({ ...open, validUntil: NOW }, NOW)).toBe(true)
    expect(pictureLinkIsOpen({ ...open, validUntil: new Date(NOW.getTime() - 1) }, NOW)).toBe(false)
  })

  // One notion of "open" for the account a link vouches for and for the picture it shows.
  it('reads a link as linkVouches does', () => {
    const owner = { ownerDeletedAt: null, ownerForeign: false, ownerEmailChecked: true }
    for (const state of Object.values(EVERY_STATE)) {
      expect(pictureLinkIsOpen(state, NOW)).toBe(linkVouches({ ...state, ...owner }, SENDER, NOW))
    }
    const atItsEnd = { ...open, validUntil: NOW }
    expect(pictureLinkIsOpen(atItsEnd, NOW)).toBe(
      linkVouches({ ...atItsEnd, ...owner }, SENDER, NOW),
    )
  })
})

describe('pictureLinkIsAcceptedOrDeleted', () => {
  it('says yes for an accepted link and for a deleted one', () => {
    expect(pictureLinkIsAcceptedOrDeleted(accepted)).toBe(true)
    expect(pictureLinkIsAcceptedOrDeleted(deleted)).toBe(true)
    expect(pictureLinkIsAcceptedOrDeleted(runOutAndDeleted)).toBe(true)
    expect(pictureLinkIsAcceptedOrDeleted(acceptedAndDeleted)).toBe(true)
    // Either mark of an acceptance alone.
    expect(pictureLinkIsAcceptedOrDeleted({ ...open, redeemedAt: AN_HOUR_AGO })).toBe(true)
    expect(pictureLinkIsAcceptedOrDeleted({ ...open, redeemedBy: ACCEPTER })).toBe(true)
  })

  // A link that only ran out keeps its pictures until the member deletes the greeting.
  it('says no for an open link and for one that ran out', () => {
    expect(pictureLinkIsAcceptedOrDeleted(open)).toBe(false)
    expect(pictureLinkIsAcceptedOrDeleted(runOut)).toBe(false)
  })
})

/**
 * The address: it knows a code and nobody. Every row of the rule, for whoever asks -- a visitor
 * who is not signed in, the sender, the one who accepted, a third member: the address cannot
 * tell them apart, and does not get to.
 */
describe('pictureRenditionsForCodeHolder', () => {
  // The account of the member who made the link stands: `null`.
  const STANDS = null

  it('open: the large rendition, and the small one where there is no large one', () => {
    expect(pictureRenditionsForCodeHolder(open, STANDS, NOW)).toEqual(['large', 'small'])
  })

  it('run out: none', () => {
    expect(pictureRenditionsForCodeHolder(runOut, STANDS, NOW)).toEqual([])
  })

  it('accepted: none -- the code shows no picture once the thank-you is taken', () => {
    expect(pictureRenditionsForCodeHolder(accepted, STANDS, NOW)).toEqual([])
  })

  it('deleted: none', () => {
    expect(pictureRenditionsForCodeHolder(deleted, STANDS, NOW)).toEqual([])
    expect(pictureRenditionsForCodeHolder(runOutAndDeleted, STANDS, NOW)).toEqual([])
    expect(pictureRenditionsForCodeHolder(acceptedAndDeleted, STANDS, NOW)).toEqual([])
  })

  /**
   * ⛔ The account of the member who made the link is deleted: the page of the link opens no
   * more, and its code shows no picture either -- though the link's own row still reads "open".
   */
  it('open, but the maker’s account is deleted: none', () => {
    expect(pictureRenditionsForCodeHolder(open, AN_HOUR_AGO, NOW)).toEqual([])
    // whenever it was deleted -- the moment is not compared with now
    expect(pictureRenditionsForCodeHolder(open, IN_A_WEEK, NOW)).toEqual([])
  })

  it('none in any other state of a deleted maker’s link', () => {
    for (const state of Object.values(EVERY_STATE)) {
      expect(pictureRenditionsForCodeHolder(state, AN_HOUR_AGO, NOW)).toEqual([])
    }
  })
})

/** The query: it knows a member who is signed in. Every row of the rule, for each of the three. */
describe('pictureRenditionsForMember', () => {
  describe('the member who made the link', () => {
    it('open, run out and accepted: the small rendition', () => {
      expect(pictureRenditionsForMember(open, SENDER)).toEqual(['small'])
      expect(pictureRenditionsForMember(runOut, SENDER)).toEqual(['small'])
      expect(pictureRenditionsForMember(accepted, SENDER)).toEqual(['small'])
    })

    it('deleted: none', () => {
      expect(pictureRenditionsForMember(deleted, SENDER)).toEqual([])
      expect(pictureRenditionsForMember(runOutAndDeleted, SENDER)).toEqual([])
      expect(pictureRenditionsForMember(acceptedAndDeleted, SENDER)).toEqual([])
    })
  })

  describe('the member who accepted it', () => {
    it('accepted: the small rendition', () => {
      expect(pictureRenditionsForMember(accepted, ACCEPTER)).toEqual(['small'])
    })

    // Before the acceptance there is nobody who accepted: the same member is a third one then.
    it('open and run out: none', () => {
      expect(pictureRenditionsForMember(open, ACCEPTER)).toEqual([])
      expect(pictureRenditionsForMember(runOut, ACCEPTER)).toEqual([])
    })

    it('deleted: none', () => {
      expect(pictureRenditionsForMember(acceptedAndDeleted, ACCEPTER)).toEqual([])
    })
  })

  describe('a third member', () => {
    it('gets none, whatever became of the link', () => {
      for (const state of Object.values(EVERY_STATE)) {
        expect(pictureRenditionsForMember(state, THIRD)).toEqual([])
      }
    })
  })

  // Never the large one by this way: it is the page's, and it is gone once the link is accepted.
  it('never names the large rendition', () => {
    for (const state of Object.values(EVERY_STATE)) {
      for (const member of [SENDER, ACCEPTER, THIRD]) {
        expect(pictureRenditionsForMember(state, member)).not.toContain('large')
      }
    }
  })

  // A link nobody accepted has NULL there; a member is never "nobody".
  it('does not take a member for the one who accepted where nobody did', () => {
    expect(pictureRenditionsForMember({ ...open, userId: SENDER, redeemedBy: null }, 0)).toEqual([])
  })
})

describe('pictureToServe', () => {
  const small: ThankYouGreetingPictureInfo = { id: 11, rendition: 'small', width: 831, height: 577 }
  const large: ThankYouGreetingPictureInfo = {
    id: 12,
    rendition: 'large',
    width: 1080,
    height: 750,
  }

  it('takes the first rendition wanted that is filed, in whatever order the rows come', () => {
    expect(pictureToServe([small, large], ['large', 'small'])).toBe(large)
    expect(pictureToServe([large, small], ['large', 'small'])).toBe(large)
    expect(pictureToServe([large, small], ['small'])).toBe(small)
  })

  it('falls back to the small one where no large one is filed', () => {
    expect(pictureToServe([small], ['large', 'small'])).toBe(small)
  })

  it('serves nothing where nothing is wanted, and nothing where nothing wanted is filed', () => {
    expect(pictureToServe([small, large], [])).toBeNull()
    expect(pictureToServe([large], ['small'])).toBeNull()
    expect(pictureToServe([], ['large', 'small'])).toBeNull()
  })
})

describe('mayAddLargePicture', () => {
  const link = { id: 7, code: 'a1f9c2d41b7e19981fa0d001', ...open }
  const small: ThankYouGreetingPictureInfo = { id: 11, rendition: 'small', width: 831, height: 577 }
  const large: ThankYouGreetingPictureInfo = {
    id: 12,
    rendition: 'large',
    width: 1080,
    height: 750,
  }
  const withSmall: ThankYouGreetingPicturesOfLink = {
    link,
    makerDeletedAt: null,
    pictures: [small],
  }

  it('lets the member who made an open link with a picture add the large rendition', () => {
    expect(mayAddLargePicture(withSmall, SENDER, NOW)).toBe(true)
  })

  it('lets nobody else', () => {
    expect(mayAddLargePicture(withSmall, THIRD, NOW)).toBe(false)
    expect(mayAddLargePicture(withSmall, ACCEPTER, NOW)).toBe(false)
  })

  it('only while the link is open', () => {
    for (const state of [runOut, accepted, deleted, runOutAndDeleted, acceptedAndDeleted]) {
      expect(
        mayAddLargePicture(
          { link: { ...link, ...state }, makerDeletedAt: null, pictures: [small] },
          SENDER,
          NOW,
        ),
      ).toBe(false)
    }
    // Nor the member who accepted it, afterwards.
    expect(
      mayAddLargePicture(
        { link: { ...link, ...accepted }, makerDeletedAt: null, pictures: [small] },
        ACCEPTER,
        NOW,
      ),
    ).toBe(false)
  })

  it('only once', () => {
    expect(
      mayAddLargePicture({ link, makerDeletedAt: null, pictures: [small, large] }, SENDER, NOW),
    ).toBe(false)
  })

  // A greeting with a motif and a plain link have no picture: the readers find nothing, and a
  // large rendition never stands alone.
  it('only for a greeting that carries a picture', () => {
    expect(mayAddLargePicture(null, SENDER, NOW)).toBe(false)
    expect(mayAddLargePicture({ link, makerDeletedAt: null, pictures: [] }, SENDER, NOW)).toBe(
      false,
    )
    expect(mayAddLargePicture({ link, makerDeletedAt: null, pictures: [large] }, SENDER, NOW)).toBe(
      false,
    )
  })
})

describe('hasFormOfLinkCode', () => {
  it('takes 24 hex characters, in either case of letters', () => {
    expect(hasFormOfLinkCode('a1f9c2d41b7e19981fa0d001')).toBe(true)
    expect(hasFormOfLinkCode('A1F9C2D41B7E19981FA0D001')).toBe(true)
    expect(hasFormOfLinkCode('000000000000000000000000')).toBe(true)
  })

  it('refuses everything else before a database is asked', () => {
    expect(hasFormOfLinkCode('a1f9c2d41b7e19981fa0d00')).toBe(false)
    expect(hasFormOfLinkCode('a1f9c2d41b7e19981fa0d0011')).toBe(false)
    expect(hasFormOfLinkCode('g1f9c2d41b7e19981fa0d001')).toBe(false)
    expect(hasFormOfLinkCode('a1f9c2d41b7e19981fa0d001\n')).toBe(false)
    expect(hasFormOfLinkCode(' a1f9c2d41b7e19981fa0d00')).toBe(false)
    expect(hasFormOfLinkCode('a1f9c2d41b7e19981fa0d%01')).toBe(false)
    expect(hasFormOfLinkCode('CL-a1f9c2d41b7e19981fa0d')).toBe(false)
    expect(hasFormOfLinkCode('')).toBe(false)
    expect(hasFormOfLinkCode(undefined)).toBe(false)
    expect(hasFormOfLinkCode(['a1f9c2d41b7e19981fa0d001'])).toBe(false)
    expect(hasFormOfLinkCode({ toString: () => 'a1f9c2d41b7e19981fa0d001' })).toBe(false)
  })
})
