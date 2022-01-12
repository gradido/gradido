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
    })
  })

  it('calls sendEMail', () => {
    expect(sendEMail).toBeCalledWith({
      to: `Peter Lustig <peter@lustig.de>`,
      subject: 'Gradido: Reset Password',
      text: expect.stringContaining('Hallo Peter Lustig') && expect.stringContaining('resetLink'),
    })
  })
})
