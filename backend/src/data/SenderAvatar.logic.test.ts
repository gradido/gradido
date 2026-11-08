// AI-GENERATED — not an architecture reference
import { showsSenderAvatar } from './SenderAvatar.logic'
import { PictureLinkState, pictureRenditionsForCodeHolder } from './ThankYouGreetingPicture.logic'

// The member who made the link and the one who accepted it, with ids that have nothing in
// common, so that none passes for the other.
const SENDER = 4711
const ACCEPTER = 815

const NOW = new Date('2026-11-06T20:00:00.000Z')
const IN_A_WEEK = new Date('2026-11-13T20:00:00.000Z')
const YESTERDAY = new Date('2026-11-05T20:00:00.000Z')
const AN_HOUR_AGO = new Date('2026-11-06T19:00:00.000Z')

// The account of the member who made the link stands: `null`.
const STANDS = null

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

describe('showsSenderAvatar', () => {
  it('open: the face goes to whoever holds the code', () => {
    expect(showsSenderAvatar(open, STANDS, NOW)).toBe(true)
  })

  it('run out: no face', () => {
    expect(showsSenderAvatar(runOut, STANDS, NOW)).toBe(false)
  })

  it('accepted: no face -- the code shows none once the thank-you is taken', () => {
    expect(showsSenderAvatar(accepted, STANDS, NOW)).toBe(false)
  })

  // Each of the two columns alone says "accepted".
  it('takes either mark of an acceptance alone', () => {
    expect(showsSenderAvatar({ ...open, redeemedAt: AN_HOUR_AGO }, STANDS, NOW)).toBe(false)
    expect(showsSenderAvatar({ ...open, redeemedBy: ACCEPTER }, STANDS, NOW)).toBe(false)
  })

  it('deleted: no face', () => {
    expect(showsSenderAvatar(deleted, STANDS, NOW)).toBe(false)
  })

  it('deleted after it ran out, or though accepted: no face', () => {
    expect(showsSenderAvatar(runOutAndDeleted, STANDS, NOW)).toBe(false)
    expect(showsSenderAvatar(acceptedAndDeleted, STANDS, NOW)).toBe(false)
  })

  // The link's own row still reads "open"; the account behind it is gone.
  it('an open link of a member whose account is deleted: no face', () => {
    expect(showsSenderAvatar(open, AN_HOUR_AGO, NOW)).toBe(false)
  })

  // The last moment a link can be accepted is the one that still shows the face.
  it('shows the face at the very moment the link runs out, and none a millisecond later', () => {
    expect(showsSenderAvatar({ ...open, validUntil: NOW }, STANDS, NOW)).toBe(true)
    expect(
      showsSenderAvatar({ ...open, validUntil: new Date(NOW.getTime() - 1) }, STANDS, NOW),
    ).toBe(false)
  })

  // One notion of who holds the code of a link: the face of its sender goes where the photo
  // of its greeting goes.
  it('answers as the photo of a greeting does for whoever holds the code', () => {
    for (const makerDeletedAt of [STANDS, AN_HOUR_AGO]) {
      for (const state of [...Object.values(EVERY_STATE), { ...open, validUntil: NOW }]) {
        expect(showsSenderAvatar(state, makerDeletedAt, NOW)).toBe(
          pictureRenditionsForCodeHolder(state, makerDeletedAt, NOW).length > 0,
        )
      }
    }
  })
})
