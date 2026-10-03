// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, jest, mock } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '../config'
import { i18n } from '../locales/localization'
import { sendAssistedRegistrationConfirmEmail } from './sendEmailVariants'

// The setup of sendEmailVariants.test.ts: a transport that takes every mail, so that the mail is
// rendered and can be read. A file of its own rather than more of that one: Bun 1.3 caches the
// transpiled form of a source file over 50 KB, and on the next run the cached test file no longer
// loads the picture the mails attach (templates/includes/chatbox-icon.png).
CONFIG.EMAIL = true
CONFIG.EMAIL_SENDER = 'info@gradido.net'
CONFIG.EMAIL_SMTP_HOST = 'localhost'
CONFIG.EMAIL_SMTP_PORT = 1025
CONFIG.EMAIL_TLS = false
CONFIG.EMAIL_TEST_MODUS = false

mock.module('nodemailer', () => {
  return {
    __esModule: true,
    createTransport: jest.fn(() => {
      return {
        sendMail: () => {
          return {
            messageId: 'message',
          }
        },
      }
    }),
  }
})

// sendEmailTranslated leaves the process in the language of its mail; this file sends in ten.
// Every test hands the locale back as the file found it (see sendEmailVariants.linkRedeemed.test.ts).
const localeBefore = i18n.getLocale()
afterEach(() => {
  i18n.setLocale(localeBefore)
})

const LOCALES = join(import.meta.dir, '..', 'locales')
const languages = readdirSync(LOCALES)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
const sentencesIn = (language: string): Record<string, string> =>
  JSON.parse(readFileSync(join(LOCALES, `${language}.json`), 'utf8')).emails
    .assistedRegistrationConfirm

/**
 * The mail that asks only to confirm the address, for an account opened while accepting a
 * thank-you (ZE-017 F5). Its first sentence says where the account came from; the mail to a
 * guest at a table says "together with a Gradido member", and nobody was beside this one.
 * Everything else is the mail it was. Measured at the rendered mail (pug, email-templates).
 */
describe('the confirm mail of an account opened while accepting a thank-you', () => {
  const guest = {
    firstName: 'Sarah',
    lastName: 'Bernard',
    email: 'sarah@provence.fr',
    language: 'de',
    confirmLink: 'http://localhost/confirm-email/9876543210',
    timeDurationObject: { hours: 24, minutes: 0 },
  }

  const sent = async (more: Record<string, unknown> = {}) => {
    const result: any = await sendAssistedRegistrationConfirmEmail({ ...guest, ...more })
    return result.originalMessage as { subject: string; html: string; text: string }
  }

  it('says that the account came of accepting a thank-you', async () => {
    const mail = await sent({ byThanks: true })

    expect(mail.html).toContain(
      'Beim Annehmen eines Danks wurde soeben ein Konto für Dich eingerichtet — mit dieser E-Mail-Adresse.<br',
    )
    expect(mail.html).not.toContain('Gemeinsam mit einem Gradido-Mitglied')
    expect(mail.text).toContain('Beim Annehmen eines Danks wurde soeben ein Konto')
  })

  it('keeps the sentence of the table for a guest at a table', async () => {
    const mail = await sent()

    expect(mail.html).toContain(
      'Gemeinsam mit einem Gradido-Mitglied wurde soeben ein Konto für Dich eingerichtet — mit dieser E-Mail-Adresse.<br',
    )
    expect(mail.html).not.toContain('Beim Annehmen eines Danks')
  })

  // One sentence apart, and nothing else: the subject, the button, the link, the validity.
  it('is the mail of the table in everything but that sentence', async () => {
    const table = await sent()
    const thanks = await sent({ byThanks: true })
    const { accountCreated, accountCreatedByThanks } = sentencesIn('de')

    expect(thanks.subject).toBe(table.subject)
    expect(thanks.html).not.toBe(table.html)
    expect(thanks.html.replace(accountCreatedByThanks, accountCreated)).toBe(table.html)
    expect(thanks.html).toContain('http://localhost/confirm-email/9876543210')
    expect(thanks.html).not.toContain('forgot-password')
  })

  // The mail goes to an address nobody has confirmed: it names nobody but the person the form
  // was filled in for.
  it('names nobody who thanked', async () => {
    const mail = await sent({ byThanks: true, senderAlias: 'Oma-Emma' })

    expect(mail.html).not.toContain('Oma-Emma')
    expect(mail.text).not.toContain('Oma-Emma')
  })

  it.each(languages)('says it in the words of %s, and not those of the table', async (language) => {
    const { accountCreated, accountCreatedByThanks } = sentencesIn(language)
    const mail = await sent({ byThanks: true, language })

    expect(accountCreatedByThanks).toBeTruthy()
    // None of the characters a mail writes as an entity: the sentence arrives as it is stored.
    expect(accountCreatedByThanks).not.toMatch(/[&<>"]/)
    expect(mail.html).toContain(`${accountCreatedByThanks}<br`)
    expect(mail.html).not.toContain(accountCreated)
  })

  // A language that fell back to English would pass the test above with English words.
  it('has a sentence of its own in each of the ten languages', () => {
    const sentences = languages.map((language) => sentencesIn(language).accountCreatedByThanks)

    expect(languages).toHaveLength(10)
    expect(new Set(sentences).size).toBe(10)
    for (const language of languages) {
      const { accountCreated, accountCreatedByThanks } = sentencesIn(language)
      expect(accountCreatedByThanks).not.toBe(accountCreated)
    }
  })

  it('hands the locale of the process back', () => {
    expect(i18n.getLocale()).toBe(localeBefore)
  })
})
