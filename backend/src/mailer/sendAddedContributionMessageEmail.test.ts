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
      subject: 'Gradido Frage zur Schöpfung',
      text:
        expect.stringContaining('Hallo Bibi Bloxberg') &&
        expect.stringContaining('Peter Lustig') &&
        expect.stringContaining('Du hast soeben zu deinem eingereichten Gradido Schöpfungsantrag "Vielen herzlichen Dank für den neuen Hexenbesen!" eine Rückfrage von Peter Lustig erhalten.') &&
        expect.stringContaining('Was für ein Besen ist es geworden?') &&
        expect.stringContaining('http://localhost/overview'),
    })
  })
})
