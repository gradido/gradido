import { sendResetPasswordEmail } from './sendResetPasswordEmail'
import { sendEMail } from './sendEMail'

jest.mock('./sendEMail', () => {
  return {
    __esModule: true,
    sendEMail: jest.fn(),
  }
})

describe('sendResetPasswordEmail', () => {
  beforeEach(async () => {
    await sendResetPasswordEmail({
      link: 'resetLink',
      firstName: 'Peter',
      lastName: 'Lustig',
      email: 'peter@lustig.de',
      duration: '23 hours and 30 minutes',
    })
  })

  it('calls sendEMail', () => {
    expect(sendEMail).toBeCalledWith({
      to: `Peter Lustig <peter@lustig.de>`,
      subject: 'Gradido: Passwort zurücksetzen',
      text:
        expect.stringContaining('Hallo Peter Lustig') &&
        expect.stringContaining('resetLink') &&
        expect.stringContaining('23 Stunden und 30 Minuten'),
    })
  })
})
