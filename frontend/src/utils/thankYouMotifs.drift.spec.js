// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { THANK_YOU_MOTIFS as SERVER_MOTIFS } from '../../../backend/src/data/ThankYouGreeting.logic'
import { THANK_YOU_MOTIF_KEYS } from './thankYouMotifs'

// The keys of the motifs exist twice: in the backend, which takes a greeting only with one of
// them, and here, where each is the name of a picture. The wallet has no dependency on the
// backend.
//
// What drift costs: a key the wallet offers and the server does not know is a greeting that
// cannot be made -- "Gruß fertigstellen" answers with an error, for that one picture. A key
// the server knows and the wallet does not is a card without its picture.
//
// The backend file is imported directly. It is dependency-free by design, and vitest
// transforms TypeScript on its own, the way useMemberAvatars.drift.spec.js does.

describe('the motifs of a thank-you greeting on both sides', () => {
  it('are the same keys here and in the backend, in the same order', () => {
    expect(THANK_YOU_MOTIF_KEYS).toEqual([...SERVER_MOTIFS])
  })
})
