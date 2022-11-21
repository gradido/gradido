import { sendTransactionReceivedEmail } from './sendTransactionReceivedEmail'
import { sendEMail } from './sendEMail'
import Decimal from 'decimal.js-light'

jest.mock('./sendEMail', () => {
  return {
    __esModule: true,
    sendEMail: jest.fn(),
  }
})

describe('sendTransactionReceivedEmail', () => {
  beforeEach(async () => {
    await sendTransactionReceivedEmail({
      senderFirstName: 'Bibi',
      senderLastName: 'Bloxberg',
      recipientFirstName: 'Peter',
      recipientLastName: 'Lustig',
      email: 'peter@lustig.de',
      senderEmail: 'bibi@bloxberg.de',
      amount: new Decimal(42.0),
      overviewURL: 'http://localhost/overview',
    })
  })

  it('calls sendEMail', () => {
    expect(sendEMail).toBeCalledWith({
      to: `Peter Lustig <peter@lustig.de>`,
      subject: 'Du hast Gradidos erhalten',
      text:
        expect.stringContaining('Hallo Peter Lustig') &&
        expect.stringContaining('42,00 GDD') &&
        expect.stringContaining('Bibi Bloxberg') &&
        expect.stringContaining('(bibi@bloxberg.de)') &&
        expect.stringContaining('http://localhost/overview'),
    })
  })
})
