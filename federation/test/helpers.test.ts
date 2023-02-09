import { contributionDateFormatter } from '@test/helpers'

describe('contributionDateFormatter', () => {
  it('formats the date correctly', () => {
    expect(
      contributionDateFormatter(new Date('Thu Feb 29 2024 13:12:11'))
    ).toEqual('2/29/2024')
  })
})
