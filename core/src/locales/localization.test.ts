import { i18n } from './localization'

describe('localization', () => {
  it('translate emails.accountMultiRegistration.contactSupport with Contact support', () => {
    expect(i18n.__('emails.accountMultiRegistration.contactSupport')).toBe('Contact support')
  })
})