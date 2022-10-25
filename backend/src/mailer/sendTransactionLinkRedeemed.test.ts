import { sendEMail } from './sendEMail'
import Decimal from 'decimal.js-light'
import { sendTransactionLinkRedeemedEmail } from './sendTransactionLinkRedeemed'

jest.mock('./sendEMail', () => {
  return {
    __esModule: true,
    sendEMail: jest.fn(),
  }
})

describe('sendTransactionLinkRedeemedEmail', () => {
  beforeEach(async () => {
    await sendTransactionLinkRedeemedEmail({
      email: 'bibi@bloxberg.de',
      senderFirstName: 'Peter',
      senderLastName: 'Lustig',
      recipientFirstName: 'Bibi',
      recipientLastName: 'Bloxberg',
      senderEmail: 'peter@lustig.de',
      amount: new Decimal(42.0),
      memo: 'Vielen Dank dass Du dabei bist',
      overviewURL: 'http://localhost/overview',
    })
  })

  it('calls sendEMail', () => {
    expect(sendEMail).toBeCalledWith({
      to: `Bibi Bloxberg <bibi@bloxberg.de>`,
      subject: 'Gradido-Link wurde eingelöst',
      text:
        expect.stringContaining('Hallo Bibi Bloxberg') &&
        expect.stringContaining(
          'Peter Lustig (peter@lustig.de) hat soeben deinen Link eingelöst.',
        ) &&
        expect.stringContaining('Betrag: 42,00 GDD,') &&
        expect.stringContaining('Memo: Vielen Dank dass Du dabei bist') &&
        expect.stringContaining(
          'Details zur Transaktion findest du in deinem Gradido-Konto: http://localhost/overview',
        ) &&
        expect.stringContaining('Bitte antworte nicht auf diese E-Mail!'),
    })
  })
})
