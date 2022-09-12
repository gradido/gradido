import Decimal from 'decimal.js-light'
import { sendContributionConfirmedEmail } from './sendContributionConfirmedEmail'
import { sendEMail } from './sendEMail'

jest.mock('./sendEMail', () => {
  return {
    __esModule: true,
    sendEMail: jest.fn(),
  }
})

describe('sendContributionConfirmedEmail', () => {
  beforeEach(async () => {
    await sendContributionConfirmedEmail({
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
      subject: 'Schöpfung wurde bestätigt',
      text:
        expect.stringContaining('Hallo Bibi Bloxberg') &&
        expect.stringContaining(
          'Deine Gradido Schöpfungsantrag "Vielen herzlichen Dank für den neuen Hexenbesen!" wurde soeben bestätigt.',
        ) &&
        expect.stringContaining('Betrag: 200,00 GDD') &&
        expect.stringContaining('Link zu deinem Konto: http://localhost/overview'),
    })
  })
})
