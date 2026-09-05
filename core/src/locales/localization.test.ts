import { hasPhraseInLocale, i18n, translateForLocale } from './localization'

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

  it('inserts the values as they are - no HTML escaping of apostrophes, ampersands, slashes', () => {
    expect(
      translateForLocale('de', 'firstCreation.catalog.helpedAtHome', {
        text: "Oma's Garten & Hof / Küche gepflegt habe",
      }),
    ).toBe("Ich habe zu Hause mitgeholfen, indem ich Oma's Garten & Hof / Küche gepflegt habe")
    expect(
      translateForLocale('en', 'firstCreation.message.greetingFemale', { name: "O'Neill" }),
    ).toBe("Dear O'Neill, welcome!")
    // A value that itself looks like a placeholder is inserted, not interpreted.
    expect(
      translateForLocale('de', 'firstCreation.message.greetingNeutral', { name: '{text}' }),
    ).toBe('Willkommen, {text}!')
  })

  it('says whether a locale carries a phrase itself, without counting the fallback', () => {
    expect(hasPhraseInLocale('de', 'firstCreation.catalog.helpedAtHome')).toBe(true)
    expect(hasPhraseInLocale('fr', 'firstCreation.catalog.helpedAtHome')).toBe(false)
    expect(hasPhraseInLocale('fr', 'emails.accountMultiRegistration.contactSupport')).toBe(true)
  })

  it('leaves a key that exists nowhere as it is', () => {
    expect(translateForLocale('de', 'firstCreation.message.doesNotExist')).toBe(
      'firstCreation.message.doesNotExist',
    )
  })
})
