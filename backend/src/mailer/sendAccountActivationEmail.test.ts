import { sendAccountActivationEmail } from './sendAccountActivationEmail'
import { sendEMail } from './sendEMail'

jest.mock('./sendEMail', () => {
  return {
    __esModule: true,
    sendEMail: jest.fn(),
  }
})

describe('sendAccountActivationEmail', () => {
  beforeEach(async () => {
    await sendAccountActivationEmail('activationLink', 'Peter', 'Lustig', 'peter@lustig.de')
  })

  it('calls sendEMail', () => {
    expect(sendEMail).toBeCalledWith({
      to: `Peter Lustig <peter@lustig.de>`,
      subject: 'Gradido: E-Mail Überprüfung',
      text:
        expect.stringContaining('Hallo Peter Lustig') && expect.stringContaining('activationLink'),
    })
  })
})
