import { hasPhraseInLocale, i18n, translateForLocale, translateForMail } from './localization'

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

  it('falls back to English for a locale it does not carry', () => {
    // All ten languages of the wallet carry the first-creation keys; Polish stands for a
    // language that might be added to the wallet before its texts reach core.
    expect(translateForLocale('pl', 'firstCreation.message.closing')).toBe('Good to have you here.')
  })

  it('answers in each of the languages the first creation ships in', () => {
    expect(translateForLocale('fr', 'firstCreation.message.greetingNeutral', { name: 'Zoé' })).toBe(
      'Bienvenue, Zoé !',
    )
    expect(translateForLocale('ru', 'firstCreation.message.closing')).toBe('Хорошо, что вы с нами.')
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
    expect(hasPhraseInLocale('fr', 'firstCreation.catalog.helpedAtHome')).toBe(true)
    // English has the phrase, Polish does not: the fallback is not counted.
    expect(hasPhraseInLocale('pl', 'firstCreation.catalog.helpedAtHome')).toBe(false)
    expect(hasPhraseInLocale('fr', 'emails.accountMultiRegistration.contactSupport')).toBe(true)
  })

  it('leaves a key that exists nowhere as it is', () => {
    expect(translateForLocale('de', 'firstCreation.message.doesNotExist')).toBe(
      'firstCreation.message.doesNotExist',
    )
  })
})

/**
 * The `t` of the mail templates. Pug escapes what it gets, so it must get the text as it is:
 * the global `t` of i18n escaped the values through Mustache first, and a mail showed
 * `https:&#x2F;&#x2F;…` and `D&#39;Angelo`.
 */
describe('translateForMail', () => {
  it('inserts the values as they are - pug escapes them, once', () => {
    expect(
      translateForMail('en', 'emails.addedContributionMessage.message', {
        message: `it's <b>here</b> & https://x.org/a?b=1`,
      }),
    ).toBe(`„it's <b>here</b> & https://x.org/a?b=1“`)
    expect(
      translateForMail('de', 'emails.general.helloName', {
        firstName: 'Chloé',
        lastName: "D'Angelo",
      }),
    ).toBe("Hallo Chloé D'Angelo,")
  })

  it('fills in one pass: a value that looks like a placeholder is not filled again', () => {
    expect(
      translateForMail('en', 'emails.general.helloName', {
        firstName: '{lastName}',
        lastName: 'Lustig',
      }),
    ).toBe('Hello {lastName} Lustig,')
  })

  it('leaves a name it is not given, or given as null or undefined, empty - as Mustache did', () => {
    expect(translateForMail('en', 'emails.general.helloName', { firstName: 'Peter' })).toBe(
      'Hello Peter ,',
    )
    expect(
      translateForMail('en', 'emails.general.helloName', { firstName: null, lastName: undefined }),
    ).toBe('Hello  ,')
  })

  it('writes a number as a number', () => {
    expect(translateForMail('en', 'emails.general.linkValidity', { hours: 23 })).toContain('23')
  })

  it('answers in the receiver’s locale without moving the global one', () => {
    const before = i18n.getLocale()
    expect(translateForMail('fr', 'emails.general.helloName', { firstName: 'Zoé' })).toBe(
      'Bonjour Zoé ,',
    )
    expect(i18n.getLocale()).toBe(before)
  })

  it('falls back to English, and to the key', () => {
    expect(translateForMail('pl', 'emails.general.helloName', { firstName: 'Ola' })).toBe(
      'Hello Ola ,',
    )
    expect(translateForMail('de', 'emails.doesNotExist')).toBe('emails.doesNotExist')
  })

  /**
   * translateForMail knows `{name}` and nothing else of Mustache. A phrase with a section, a
   * comment or spaces inside the braces would lose them silently - so no mail phrase may use
   * one, in any of the ten catalogs.
   */
  it('covers every mail phrase: they use nothing of Mustache but {name}', () => {
    const phrases = (node: unknown, path: string): [string, string][] =>
      typeof node === 'string'
        ? [[path, node]]
        : Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
            phrases(value, `${path}.${key}`),
          )
    const locales = ['de', 'el', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr']
    const other = locales.flatMap((locale) =>
      phrases(i18n.getCatalog(locale), locale)
        .filter(([path]) => path.startsWith(`${locale}.emails.`))
        .flatMap(([path, phrase]) =>
          (phrase.match(/\{[^}]*\}?/g) ?? [])
            .filter((brace) => !/^\{\w+\}$/.test(brace))
            .map((brace) => `${path}: ${brace}`),
        ),
    )
    expect(other).toEqual([])
    // The check sees the catalogs: the mail phrases are there, with placeholders in them.
    expect(i18n.getCatalog('de')['emails.general.helloName']).toContain('{firstName}')
  })
})

/**
 * What a messenger is shown of a redeem link (backend, server/redeemPreview.ts): four titles
 * and the line under them. The backend writes them into a document in the sender's language
 * and escapes them there; a catalog without one of them would hand out the English phrase
 * under its own language.
 */
describe('the phrases of the preview of a redeem link', () => {
  const locales = ['de', 'el', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr']
  const namingTheSender = ['redeemPreview.greetingTitle', 'redeemPreview.linkTitle']
  const namingNobody = [
    'redeemPreview.description',
    'redeemPreview.greetingTitleWithoutName',
    'redeemPreview.linkTitleWithoutName',
  ]
  const catalogOf = (locale: string) => i18n.getCatalog(locale) as Record<string, string>

  it('are these five in each of the ten catalogs, in words of its own', () => {
    for (const locale of locales) {
      const own = Object.keys(catalogOf(locale)).filter((key) => key.startsWith('redeemPreview.'))
      expect({ locale, own: own.sort() }).toEqual({
        locale,
        own: [...namingTheSender, ...namingNobody].sort(),
      })
      for (const key of own) {
        expect(hasPhraseInLocale(locale, key)).toBe(true)
        expect(catalogOf(locale)[key].trim()).not.toBe('')
      }
    }
  })

  it('carry {name} once where the sender is named, and nothing to fill in anywhere else', () => {
    for (const locale of locales) {
      for (const key of namingTheSender) {
        const around = catalogOf(locale)[key].split('{name}')
        expect({ locale, key, parts: around.length }).toEqual({ locale, key, parts: 2 })
        expect(around.join('')).not.toMatch(/[{}]/)
      }
      for (const key of namingNobody) {
        expect(catalogOf(locale)[key]).not.toMatch(/[{}]/)
      }
    }
  })
})
