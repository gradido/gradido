// AI-GENERATED — not an architecture reference
import 'reflect-metadata'
import { ThankYouGreeting } from './ThankYouGreeting'

/**
 * A greeting carries a motif or a picture of the member's own, one of the two
 * (thankYouGreetingSchema). So the row says by itself which: the lists of links and of bookings
 * read `hasPicture` off it, with no look at the pictures' table.
 */
describe('ThankYouGreeting', () => {
  it('says of a greeting with a motif that it has no picture of its own', () => {
    const greeting = new ThankYouGreeting({
      motif: 'morning-light',
      line: 'Einfach so — weil es Dich gibt.',
      recipientName: 'Sarah',
    })

    expect(greeting).toEqual({
      motif: 'morning-light',
      line: 'Einfach so — weil es Dich gibt.',
      recipientName: 'Sarah',
      hasPicture: false,
    })
  })

  it('says of a greeting without a motif that it has one', () => {
    const greeting = new ThankYouGreeting({ motif: null, line: null, recipientName: null })

    expect(greeting).toEqual({ motif: null, line: null, recipientName: null, hasPicture: true })
  })

  // Nothing of a picture is in the model: only that there is one.
  it('carries nothing of the picture itself', () => {
    const greeting = new ThankYouGreeting({ motif: null, line: null, recipientName: null })

    expect(Object.keys(greeting).sort()).toEqual(['hasPicture', 'line', 'motif', 'recipientName'])
  })
})
