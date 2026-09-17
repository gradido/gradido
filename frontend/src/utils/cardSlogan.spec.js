// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { cardSlogan } from './cardSlogan'

describe('cardSlogan', () => {
  // Help, give, thank -- the order the sign-in pages show, on one line for the cards.
  it('joins the three words of the first triad in their order', () => {
    expect(cardSlogan((key) => `<${key}>`)).toBe(
      '<auth.triads.slogan.help> <auth.triads.slogan.give> <auth.triads.slogan.thank>',
    )
  })
})
