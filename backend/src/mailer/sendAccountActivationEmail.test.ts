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
    await sendAccountActivationEmail({
      link: 'activationLink',
      firstName: 'Peter',
      lastName: 'Lustig',
      email: 'peter@lustig.de',
      duration: '23 hours and 30 minutes',
    })
  })

  it('calls sendEMail', () => {
    expect(sendEMail).toBeCalledWith({
      to: `Peter Lustig <peter@lustig.de>`,
      subject: 'Gradido: E-Mail Überprüfung',
      text:
        expect.stringContaining('Hallo Peter Lustig') &&
        expect.stringContaining('activationLink') &&
        expect.stringContaining('23 Stunden und 30 Minuten'),
    })
  })
})
