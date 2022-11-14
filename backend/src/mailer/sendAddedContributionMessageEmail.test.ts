import { sendAddedContributionMessageEmail } from './sendAddedContributionMessageEmail'
import { sendEMail } from './sendEMail'

jest.mock('./sendEMail', () => {
  return {
    __esModule: true,
    sendEMail: jest.fn(),
  }
})

describe('sendAddedContributionMessageEmail', () => {
  beforeEach(async () => {
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
      subject: 'Nachricht zu deinem Gemeinwohl-Beitrag',
      text:
        expect.stringContaining('Hallo Bibi Bloxberg') &&
        expect.stringContaining('Peter Lustig') &&
        expect.stringContaining(
          'du hast zu deinem Gemeinwohl-Beitrag "Vielen herzlichen Dank für den neuen Hexenbesen!" eine Nachricht von Peter Lustig erhalten.',
        ) &&
        expect.stringContaining('Was für ein Besen ist es geworden?') &&
        expect.stringContaining('http://localhost/overview'),
    })
  })
})
