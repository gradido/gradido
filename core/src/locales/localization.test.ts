import { i18n, translateForLocale } from './localization'

describe('localization', () => {
  it('translate emails.accountMultiRegistration.contactSupport with Contact support', () => {
    expect(i18n.__('emails.accountMultiRegistration.contactSupport')).toBe('Contact support')
  })
})

describe('translateForLocale', () => {
  it('answers in the requested locale without moving the global one', () => {
    const before = i18n.getLocale()
    expect(translateForLocale('de', 'firstCreation.message.closing')).toBe(
      'Schön, dass Du da bist.',
    )
    expect(i18n.getLocale()).toBe(before)
  })

  it('fills the placeholders of the phrase', () => {
    expect(translateForLocale('de', 'firstCreation.message.greetingFemale', { name: 'Emma' })).toBe(
      'Liebe Emma, willkommen!',
    )
    expect(
      translateForLocale('de', 'firstCreation.catalog.helpedSickPerson', {
        text: 'Suppe gekocht habe',
      }),
    ).toBe('Ich habe einem kranken Menschen geholfen, indem ich Suppe gekocht habe')
  })

  it('falls back to English for a locale that has no translation yet', () => {
    // The first-creation keys exist in de and en only for now (L1).
    expect(translateForLocale('fr', 'firstCreation.message.closing')).toBe('Good to have you here.')
  })

  it('leaves a key that exists nowhere as it is', () => {
    expect(translateForLocale('de', 'firstCreation.message.doesNotExist')).toBe(
      'firstCreation.message.doesNotExist',
    )
  })
})
