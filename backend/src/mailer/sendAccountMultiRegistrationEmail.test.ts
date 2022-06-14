import CONFIG from '@/config'
import { sendAccountMultiRegistrationEmail } from './sendAccountMultiRegistrationEmail'
import { sendEMail } from './sendEMail'

jest.mock('./sendEMail', () => {
  return {
    __esModule: true,
    sendEMail: jest.fn(),
  }
})

describe('sendAccountMultiRegistrationEmail', () => {
  beforeEach(async () => {
    await sendAccountMultiRegistrationEmail({
      firstName: 'Peter',
      lastName: 'Lustig',
      email: 'peter@lustig.de',
    })
  })

  it('calls sendEMail', () => {
    expect(sendEMail).toBeCalledWith({
      to: `Peter Lustig <peter@lustig.de>`,
      subject: 'Gradido: Erneuter Registrierungsversuch mit deiner E-Mail',
      text:
        expect.stringContaining('Hallo Peter Lustig') &&
        expect.stringContaining(CONFIG.EMAIL_LINK_FORGOTPASSWORD) &&
        expect.stringContaining('https://gradido.net/de/contact/'),
    })
  })
})
