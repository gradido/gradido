// AI-GENERATED — not an architecture reference
import { TransactionTypeId } from 'database'
import { THANK_YOU_MOTIFS } from './ThankYouGreeting.logic'
import {
  BookingPictureColumns,
  transactionPictureIdOf,
  transactionPictureIdsOf,
} from './TransactionPicture.logic'
import { transactionPictureSchema } from './TransactionPicture.schema'

const row = (
  typeId: TransactionTypeId,
  transactionPictureId: number | null | undefined,
  transactionLinkId: number | null = null,
): BookingPictureColumns => ({ typeId, transactionPictureId, transactionLinkId })

describe('transactionPictureIdOf', () => {
  it('is the picture of a transfer, on the sender’s row and on the recipient’s', () => {
    expect(transactionPictureIdOf(row(TransactionTypeId.SEND, 7))).toBe(7)
    expect(transactionPictureIdOf(row(TransactionTypeId.RECEIVE, 7))).toBe(7)
  })

  it('is null for a transfer without a picture', () => {
    expect(transactionPictureIdOf(row(TransactionTypeId.SEND, null))).toBeNull()
    expect(transactionPictureIdOf(row(TransactionTypeId.RECEIVE, undefined))).toBeNull()
    expect(transactionPictureIdOf(row(TransactionTypeId.SEND, 0))).toBeNull()
  })

  it.each([TransactionTypeId.CREATION, TransactionTypeId.DECAY, TransactionTypeId.LINK_SUMMARY])(
    'is null for a booking of type %s, whatever its row carries',
    (typeId) => {
      expect(transactionPictureIdOf(row(typeId, 7))).toBeNull()
    },
  )

  it('is null for a booking made from a link: that one has a greeting or nothing', () => {
    expect(transactionPictureIdOf(row(TransactionTypeId.SEND, 7, 3))).toBeNull()
    expect(transactionPictureIdOf(row(TransactionTypeId.RECEIVE, 7, 3))).toBeNull()
  })
})

describe('transactionPictureIdsOf', () => {
  it('names every picture of a page once', () => {
    expect(
      transactionPictureIdsOf([
        row(TransactionTypeId.SEND, 7),
        row(TransactionTypeId.RECEIVE, 9),
        row(TransactionTypeId.SEND, 7),
        row(TransactionTypeId.SEND, null),
        row(TransactionTypeId.CREATION, 11),
        row(TransactionTypeId.RECEIVE, 12, 4),
      ]),
    ).toEqual([7, 9])
  })

  it('is empty for a page without a picture', () => {
    expect(
      transactionPictureIdsOf([
        row(TransactionTypeId.SEND, null),
        row(TransactionTypeId.CREATION, null),
      ]),
    ).toEqual([])
    expect(transactionPictureIdsOf([])).toEqual([])
  })
})

describe('transactionPictureSchema', () => {
  const photo = { data: 'AAAA', width: 831, height: 577 }

  it.each(THANK_YOU_MOTIFS)('takes the motif %s', (motif) => {
    expect(transactionPictureSchema.parse({ motif })).toEqual({ motif })
  })

  it('takes a photo', () => {
    expect(transactionPictureSchema.parse({ picture: photo })).toEqual({ picture: photo })
  })

  it('takes neither, as nothing, null or left out', () => {
    expect(transactionPictureSchema.safeParse({}).success).toBe(true)
    expect(transactionPictureSchema.safeParse({ motif: null, picture: null }).success).toBe(true)
    expect(
      transactionPictureSchema.safeParse({ motif: undefined, picture: undefined }).success,
    ).toBe(true)
  })

  it('refuses both at once, and says so without quoting either', () => {
    const parsed = transactionPictureSchema.safeParse({ motif: 'bouquet', picture: photo })

    expect(parsed.success).toBe(false)
    expect(!parsed.success && parsed.error.issues[0].message).toBe(
      'Transfer picture: a motif or a photo, not both',
    )
  })

  it.each(['', 'Bouquet', 'elephant', ' bouquet', '../../etc/passwd'])(
    'refuses the unknown motif "%s"',
    (motif) => {
      const parsed = transactionPictureSchema.safeParse({ motif })

      expect(parsed.success).toBe(false)
      expect(!parsed.success && parsed.error.issues[0].message).toBe(
        'Transfer picture: unknown motif',
      )
    },
  )

  it('refuses a photo that has not the shape of one', () => {
    expect(transactionPictureSchema.safeParse({ picture: { data: 'AAAA' } }).success).toBe(false)
    expect(
      transactionPictureSchema.safeParse({ picture: { data: 7, width: 1, height: 1 } }).success,
    ).toBe(false)
  })
})
