import Decimal from 'decimal.js-light'
import { sendContributionRejectedEmail } from './sendContributionRejectedEmail'
import { sendEMail } from './sendEMail'

jest.mock('./sendEMail', () => {
  return {
    __esModule: true,
    sendEMail: jest.fn(),
  }
})

describe('sendContributionConfirmedEmail', () => {
  beforeEach(async () => {
    await sendContributionRejectedEmail({
      senderFirstName: 'Peter',
      senderLastName: 'Lustig',
      recipientFirstName: 'Bibi',
      recipientLastName: 'Bloxberg',
      recipientEmail: 'bibi@bloxberg.de',
      contributionMemo: 'Vielen herzlichen Dank für den neuen Hexenbesen!',
      contributionAmount: new Decimal(200.0),
      overviewURL: 'http://localhost/overview',
    })
  })

  it('calls sendEMail', () => {
    expect(sendEMail).toBeCalledWith({
      to: 'Bibi Bloxberg <bibi@bloxberg.de>',
      subject: 'Dein Gemeinwohl-Beitrag wurde abgelehnt',
      text:
        expect.stringContaining('Hallo Bibi Bloxberg') &&
        expect.stringContaining(
          'dein Gemeinwohl-Beitrag "Vielen herzlichen Dank für den neuen Hexenbesen!" wurde von Peter Lustig abgelehnt.',
        ) &&
        expect.stringContaining('Link zu deinem Konto: http://localhost/overview'),
    })
  })
})
