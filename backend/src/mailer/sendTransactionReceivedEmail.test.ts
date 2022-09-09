import {
  sendAddedContributionMessageEmail,
  sendTransactionReceivedEmail,
} from './sendTransactionReceivedEmail'
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
      memo: 'Vielen herzlichen Dank für den neuen Hexenbesen!',
      overviewURL: 'http://localhost/overview',
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
        expect.stringContaining('(bibi@bloxberg.de)') &&
        expect.stringContaining('Vielen herzlichen Dank für den neuen Hexenbesen!') &&
        expect.stringContaining('http://localhost/overview'),
    })
  })
})

describe('sendAddedContributionMessageEmail', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await sendAddedContributionMessageEmail({
      senderFirstName: 'Peter',
      senderLastName: 'Lustig',
      recipientFirstName: 'Bibi',
      recipientLastName: 'Bloxberg',
      recipientEmail: 'bibi@bloxberg.de',
      senderEmail: 'peter@lustig.de',
      contributionMemo: 'Vielen herzlichen Dank für den neuen Hexenbesen!',
      message: 'Was für ein Besen ist es geworden?',
      overviewURL: 'http://localhost/overview',
    })
  })

  it('calls sendEMail', () => {
    expect(sendEMail).toBeCalledWith({
      to: `Bibi Bloxberg <bibi@bloxberg.de>`,
      subject: 'Gradido Frage zur Schöpfung',
      text:
        expect.stringContaining('Hallo Bibi Bloxberg') &&
        expect.stringContaining('Peter Lustig') &&
        expect.stringContaining('Vielen herzlichen Dank für den neuen Hexenbesen!') &&
        expect.stringContaining('Was für ein Besen ist es geworden?') &&
        expect.stringContaining('http://localhost/overview'),
    })
  })
})
