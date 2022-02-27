import { sendTransactionReceivedEmail } from './sendTransactionReceivedEmail'
import { sendEMail } from './sendEMail'
import Decimal from '../util/decimal'

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
      amount: new Decimal(42.0),
      memo: 'Vielen herzlichen Dank für den neuen Hexenbesen!',
    })
  })

  it('calls sendEMail', () => {
    expect(sendEMail).toBeCalledWith({
      to: `Peter Lustig <peter@lustig.de>`,
      subject: 'Gradido Überweisung',
      text:
        expect.stringContaining('Hallo Peter Lustig') &&
        expect.stringContaining('42,00 GDD') &&
        expect.stringContaining('Bibi Bloxberg') &&
        expect.stringContaining('Vielen herzlichen Dank für den neuen Hexenbesen!'),
    })
  })
})
