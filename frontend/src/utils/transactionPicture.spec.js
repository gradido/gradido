// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { THANK_YOU_MOTIF_KEYS } from './thankYouMotifs'
import { transactionPictureShown } from './transactionPicture'

const t = (key) => key

describe('transactionPictureShown', () => {
  it('shows nothing for a booking without a picture', () => {
    expect(transactionPictureShown(null, t)).toBeNull()
    expect(transactionPictureShown(undefined, t)).toBeNull()
  })

  it('shows a photo where the picture is one, whatever the motif says', () => {
    expect(transactionPictureShown({ motif: null, hasPicture: true }, t)).toEqual({ photo: true })
    expect(transactionPictureShown({ motif: 'bouquet', hasPicture: true }, t)).toEqual({
      photo: true,
    })
  })

  it.each(THANK_YOU_MOTIF_KEYS)('shows the motif %s with its file and its name', (key) => {
    expect(transactionPictureShown({ motif: key, hasPicture: false }, t)).toEqual({
      motif: {
        key,
        src: `/img/thank-you-greeting/${key}.svg`,
        name: `thank-you-greeting.motif.${key}`,
      },
    })
  })

  it('shows nothing for a motif this wallet does not know, nor for a picture that is neither', () => {
    expect(transactionPictureShown({ motif: 'elephant', hasPicture: false }, t)).toBeNull()
    expect(transactionPictureShown({ motif: null, hasPicture: false }, t)).toBeNull()
  })
})
