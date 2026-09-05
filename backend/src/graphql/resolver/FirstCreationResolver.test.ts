// AI-GENERATED — not an architecture reference
import { ContributionMessageType } from '@enum/ContributionMessageType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { RoleNames } from '@enum/RoleNames'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { sendAddedContributionMessageEmail, sendContributionConfirmedEmail } from 'core'
import {
  AppDatabase,
  Contribution as DbContribution,
  ContributionMessage as DbContributionMessage,
  Event as DbEvent,
  User as DbUser,
  UserContact as DbUserContact,
  UserRole as DbUserRole,
  dbSelectFirstCreationByUserId,
  dbUpdateFirstCreationOutcome,
  FirstCreationReviewReason,
  FirstCreationStatus,
  FirstCreationTestMode,
  firstCreationsTable,
} from 'database'
import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { getLogger as originalGetLogger } from 'log4js'
import { Mutex } from 'redis-semaphore'
import { GradidoUnit } from 'shared'
import { AnthropicClient } from '@/apis/anthropic/AnthropicClient'
import { composeFirstCreationGreeting } from '@/data/FirstCreation.logic'
import {
  EVENT_FIRST_CREATION_DONE,
  EVENT_FIRST_CREATION_REVIEW,
} from '@/event/EVENT_FIRST_CREATION'
import { EventType } from '@/event/Events'
import { createUserContribution } from '@/graphql/resolver/util/createUserContribution'
import { creationFactory } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import {
  login,
  setFirstCreationSigner,
  skipFirstCreation,
  submitFirstCreation,
} from '@/seeds/graphql/mutations'
import { creaSettings, firstCreationStatus } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

// The whole process against a real database, with the model replaced by a hand: the
// contributions, the thread, the booking and the events are the existing paths and are
// asserted as such; only Crea's lines are canned, because the seam under test is what the
// interaction DOES with an answer, a raised hand and no answer at all.

jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendAddedContributionMessageEmail: jest.fn(),
    sendContributionConfirmedEmail: jest.fn(),
    sendEmailTranslated: jest.fn(),
  }
})
jest.mock('@/password/EncryptorUtils')

// The outcome events write a row of their own; one of them is made to fail once below.
jest.mock('@/event/EVENT_FIRST_CREATION', () => {
  const actual = jest.requireActual('@/event/EVENT_FIRST_CREATION')
  return {
    ...actual,
    EVENT_FIRST_CREATION_DONE: jest.fn(actual.EVENT_FIRST_CREATION_DONE),
    EVENT_FIRST_CREATION_REVIEW: jest.fn(actual.EVENT_FIRST_CREATION_REVIEW),
  }
})
// The filing core, so one entry of a bundle can be made to fail.
jest.mock('@/graphql/resolver/util/createUserContribution', () => {
  const actual = jest.requireActual('@/graphql/resolver/util/createUserContribution')
  return { ...actual, createUserContribution: jest.fn(actual.createUserContribution) }
})

// The client is a singleton behind a config gate; the tests need it present and mute. The
// spy is created INSIDE the factory (the factory runs while the imports above are still
// being resolved) and fetched back through the mocked module.
jest.mock('@/apis/anthropic/AnthropicClient', () => {
  const firstCreationLines = jest.fn()
  return { AnthropicClient: { getInstance: () => ({ firstCreationLines }) } }
})
const firstCreationLines = (
  AnthropicClient.getInstance() as unknown as { firstCreationLines: jest.Mock }
).firstCreationLines

const addedMessageMail = sendAddedContributionMessageEmail as jest.Mock
const doneEvent = EVENT_FIRST_CREATION_DONE as unknown as jest.Mock
const reviewEvent = EVENT_FIRST_CREATION_REVIEW as unknown as jest.Mock
const fileOne = createUserContribution as unknown as jest.Mock
const realFileOne = jest.requireActual(
  '@/graphql/resolver/util/createUserContribution',
).createUserContribution
const confirmedMail = sendContributionConfirmedEmail as jest.Mock

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

let peter: DbUser
let bibi: DbUser
let bob: DbUser
let raeuber: DbUser

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
  // A failed login leaves the token empty, and an empty token answers every guarded call
  // with `401 Unauthorized` - the very words some tests below assert.
  expect(errors).toBeUndefined()
}

const answer = (lines: string[], suspicious = false, reason = '') => ({
  success: true,
  value: { answer: { lines, suspicious, reason }, model: 'claude-test' },
})

const bundle = [
  { catalogKey: 'helpedParish', text: 'Kuchen fürs Gemeindefest gebacken habe' },
  { catalogKey: 'helpedNeighbourhood', text: 'für die Nachbarskinder gekocht habe' },
  { catalogKey: 'retiree' },
]

const rowOf = async (user: DbUser) => {
  const row = await dbSelectFirstCreationByUserId(user.id)
  if (!row) {
    throw new Error('no first creation row')
  }
  return row
}

const contributionsOf = (user: DbUser) =>
  DbContribution.find({ where: { userId: user.id }, order: { id: 'ASC' }, withDeleted: true })

const messagesOn = (contributionId: number) =>
  DbContributionMessage.find({ where: { contributionId }, order: { id: 'ASC' } })

const eventsOf = (type: EventType, user: DbUser) =>
  DbEvent.find({ where: { type, affectedUserId: user.id } })

/** Reopens a finished process the way the function test (L4) will: the SAME row, FORCED. */
const reopen = async (user: DbUser, testMode: FirstCreationTestMode | null) => {
  const row = await rowOf(user)
  const moved = await dbUpdateFirstCreationOutcome(row.id, row.status as FirstCreationStatus, {
    status: FirstCreationStatus.FORCED,
    testMode,
  })
  expect(moved.success).toBe(true)
}

beforeAll(async () => {
  testEnv = await testEnvironment(originalGetLogger('apollo'))
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  peter = await userFactory(testEnv, peterLustig)
  bibi = await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, { ...bobBaumeister, role: RoleNames.MODERATOR })
  raeuber = await userFactory(testEnv, raeuberHotzenplotz)
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

beforeEach(() => {
  addedMessageMail.mockClear()
  confirmedMail.mockClear()
  firstCreationLines.mockReset()
})

describe('FirstCreationResolver', () => {
  describe('before a signer is configured', () => {
    it('shows the member no window and refuses to save', async () => {
      await loginAs('bibi@bloxberg.de')
      const { data } = await query({ query: firstCreationStatus })
      expect(data.firstCreationStatus).toMatchObject({
        state: 'NONE',
        eligible: false,
        message: null,
        entries: [],
        functionTestsEnabled: false,
        testRunsLeft: null,
      })
      const { errors } = await mutate({
        mutation: submitFirstCreation,
        variables: { entries: bundle },
      })
      expect(errors).toEqual([new GraphQLError('FIRST_CREATION_NOT_ELIGIBLE: NO_SIGNER')])
      expect(await contributionsOf(bibi)).toHaveLength(0)
    })

    it('shows the admin no signer', async () => {
      await loginAs('peter@lustig.de')
      const { data } = await query({ query: creaSettings })
      expect(data.creaSettings.firstCreationSigner).toBeNull()
    })
  })

  describe('picking the signer', () => {
    it('is admin business - a moderator is refused', async () => {
      await loginAs('bob@baumeister.de')
      const { errors } = await mutate({
        mutation: setFirstCreationSigner,
        variables: { userId: peter.id },
      })
      expect(errors).toEqual([new GraphQLError('401 Unauthorized')])
    })

    it('refuses a plain member and a moderator with a group scope', async () => {
      await loginAs('peter@lustig.de')
      const member = await mutate({
        mutation: setFirstCreationSigner,
        variables: { userId: bibi.id },
      })
      expect(member.errors).toEqual([
        new GraphQLError('FIRST_CREATION_SIGNER_UNAVAILABLE: NOT_MODERATION'),
      ])
      const bobRole = await DbUserRole.findOneByOrFail({ userId: bob.id })
      bobRole.visibleCreationGroups = JSON.stringify(['feuerwehr'])
      await bobRole.save()
      const scoped = await mutate({
        mutation: setFirstCreationSigner,
        variables: { userId: bob.id },
      })
      expect(scoped.errors).toEqual([new GraphQLError('FIRST_CREATION_SIGNER_UNAVAILABLE: SCOPED')])
      bobRole.visibleCreationGroups = null
      await bobRole.save()
      expect(
        await mutate({ mutation: setFirstCreationSigner, variables: { userId: 424242 } }),
      ).toEqual(
        expect.objectContaining({
          errors: [new GraphQLError('FIRST_CREATION_SIGNER_UNAVAILABLE: NOT_FOUND')],
        }),
      )
    })

    it('stores an admin and shows them on the settings', async () => {
      await loginAs('peter@lustig.de')
      const { data, errors } = await mutate({
        mutation: setFirstCreationSigner,
        variables: { userId: peter.id },
      })
      expect(errors).toBeUndefined()
      expect(data.setFirstCreationSigner).toMatchObject({
        userId: peter.id,
        firstName: 'Peter',
        role: 'ADMIN',
        eligible: true,
        reason: '',
      })
      const settings = await query({ query: creaSettings })
      expect(settings.data.creaSettings.firstCreationSigner).toMatchObject({
        userId: peter.id,
        eligible: true,
      })
    })
  })

  describe('with a signer, a member who never created', () => {
    it('sees the window and may skip it - the skip is an event, not a row', async () => {
      await loginAs('bibi@bloxberg.de')
      const { data } = await query({ query: firstCreationStatus })
      expect(data.firstCreationStatus).toMatchObject({ state: 'NONE', eligible: true })
      const skipped = await mutate({ mutation: skipFirstCreation })
      expect(skipped.data.skipFirstCreation).toBe(true)
      expect(await eventsOf(EventType.FIRST_CREATION_SKIP, bibi)).toHaveLength(1)
      expect(await dbSelectFirstCreationByUserId(bibi.id)).toBeNull()
      const again = await query({ query: firstCreationStatus })
      expect(again.data.firstCreationStatus.eligible).toBe(true)
    })

    it('writes no skip event for a member whose window is not open', async () => {
      // Peter is the signer and therefore not eligible; his skip must not count.
      await loginAs('peter@lustig.de')
      const skipped = await mutate({ mutation: skipFirstCreation })
      expect(skipped.data.skipFirstCreation).toBe(true)
      expect(await eventsOf(EventType.FIRST_CREATION_SKIP, peter)).toHaveLength(0)
    })

    it('refuses entries that cannot become sentences, before anything is filed', async () => {
      await loginAs('bibi@bloxberg.de')
      const cases: [object[], string][] = [
        [[], 'NO_ENTRIES'],
        [
          [{ catalogKey: 'somethingElse', text: 'x' }],
          'FIRST_CREATION_ENTRY_INVALID at 0: UNKNOWN_KEY',
        ],
        [
          [{ catalogKey: 'helpedAtHome', text: '  ' }],
          'FIRST_CREATION_ENTRY_INVALID at 0: TEXT_MISSING',
        ],
        [[{ catalogKey: 'retiree' }, { catalogKey: 'retiree' }], 'DUPLICATE_CHECK'],
      ]
      for (const [entries, detail] of cases) {
        const { errors } = await mutate({ mutation: submitFirstCreation, variables: { entries } })
        expect(errors).toEqual([new GraphQLError(`FIRST_CREATION_ENTRIES_INVALID: ${detail}`)])
      }
      expect(await contributionsOf(bibi)).toHaveLength(0)
      expect(firstCreationLines).not.toHaveBeenCalled()
    })

    it('outcome A: files, asks the model without the name, comments, confirms, thanks', async () => {
      firstCreationLines.mockResolvedValue(
        answer(['für den Kuchen zum Gemeindefest', 'für das Kochen für die Nachbarskinder']),
      )
      await loginAs('bibi@bloxberg.de')
      const { data, errors } = await mutate({
        mutation: submitFirstCreation,
        variables: { entries: bundle },
      })
      expect(errors).toBeUndefined()

      // Only the two completed sentences reach the model, in the member's language; the
      // tick has its fixed line, and nothing about the person travels (E-012).
      expect(firstCreationLines).toHaveBeenCalledTimes(1)
      const [sentEntries, language] = firstCreationLines.mock.calls[0]
      expect(sentEntries.map((entry: { memo: string }) => entry.memo)).toEqual([
        'Ich habe in meiner Gemeinde oder Kirchengemeinde mitgeholfen, indem ich Kuchen fürs Gemeindefest gebacken habe',
        'Ich habe in der Nachbarschaft mitgeholfen, wo Hilfe gebraucht wurde, indem ich für die Nachbarskinder gekocht habe',
      ])
      expect(language).toBe('de')
      expect(JSON.stringify(firstCreationLines.mock.calls[0])).not.toContain('Bibi')

      const expectedMessage = [
        composeFirstCreationGreeting('Bibi', 'de'),
        'Die Gemeinschaft dankt Dir — für den Kuchen zum Gemeindefest, für das Kochen für die Nachbarskinder. Und für Dein Lebenswerk: all die Jahre, in denen Du für andere da warst.',
        'Deine ersten 100 Gradido sind Dank für das, was Du längst getan hast.',
        'Schön, dass Du da bist.',
      ].join('\n')
      expect(data.submitFirstCreation).toMatchObject({
        state: FirstCreationStatus.DONE,
        eligible: false,
        message: expectedMessage,
      })
      expect(data.submitFirstCreation.entries).toEqual([
        { memo: expect.stringContaining('Gemeindefest'), confirmed: true, status: 'CONFIRMED' },
        { memo: expect.stringContaining('Nachbarskinder'), confirmed: true, status: 'CONFIRMED' },
        { memo: 'Ich bin Rentnerin / Rentner.', confirmed: true, status: 'CONFIRMED' },
      ])

      // Three ordinary USER contributions, booked in the signer's name, 33,34 + 33,33 + 33,33.
      const contributions = await contributionsOf(bibi)
      expect(contributions).toHaveLength(3)
      expect(contributions.map((c) => c.amount.toString())).toEqual(['33.34', '33.33', '33.33'])
      for (const contribution of contributions) {
        expect(contribution).toMatchObject({
          contributionType: 'USER',
          contributionStatus: ContributionStatus.CONFIRMED,
          confirmedBy: peter.id,
        })
        expect(contribution.confirmedAt).not.toBeNull()
        expect(contribution.transactionId).not.toBeNull()
      }
      // ONE message, on the FIRST contribution, from the signer (ES-009).
      const messages = await messagesOn(contributions[0].id)
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        userId: peter.id,
        type: ContributionMessageType.DIALOG,
        isModerator: true,
        message: expectedMessage,
      })
      expect(await messagesOn(contributions[1].id)).toHaveLength(0)
      // The one comment mail plus the normal confirmation mail per contribution.
      expect(addedMessageMail).toHaveBeenCalledTimes(1)
      expect(addedMessageMail.mock.calls[0][0]).toMatchObject({
        message: expectedMessage,
        language: 'de',
      })
      expect(confirmedMail).toHaveBeenCalledTimes(3)
      // The row and the event.
      expect(await rowOf(bibi)).toMatchObject({
        status: FirstCreationStatus.DONE,
        entriesCount: 3,
        contributionIds: contributions.map((c) => c.id),
        message: expectedMessage,
        model: 'claude-test',
        signerUserId: peter.id,
        reviewReason: null,
      })
      expect(await eventsOf(EventType.FIRST_CREATION_DONE, bibi)).toHaveLength(1)
      expect((await eventsOf(EventType.FIRST_CREATION_DONE, bibi))[0]).toMatchObject({
        actingUserId: peter.id,
        involvedContributionId: contributions[0].id,
      })
    })

    it('a second save is refused, and the status reads the ticks off the contributions', async () => {
      await loginAs('bibi@bloxberg.de')
      const { errors } = await mutate({
        mutation: submitFirstCreation,
        variables: { entries: bundle },
      })
      expect(errors).toEqual([new GraphQLError('FIRST_CREATION_NOT_ELIGIBLE: ALREADY_STARTED')])
      const { data } = await query({ query: firstCreationStatus })
      expect(data.firstCreationStatus).toMatchObject({
        state: FirstCreationStatus.DONE,
        eligible: false,
      })
      expect(
        data.firstCreationStatus.entries.every((e: { confirmed: boolean }) => e.confirmed),
      ).toBe(true)
      expect(await contributionsOf(bibi)).toHaveLength(3)
    })
  })

  describe('the signer as a member', () => {
    it('cannot run their own first creation - the window stays shut', async () => {
      await loginAs('peter@lustig.de')
      const { data } = await query({ query: firstCreationStatus })
      expect(data.firstCreationStatus.eligible).toBe(false)
      const { errors } = await mutate({
        mutation: submitFirstCreation,
        variables: { entries: [{ catalogKey: 'retiree' }] },
      })
      expect(errors).toEqual([new GraphQLError('FIRST_CREATION_NOT_ELIGIBLE: NO_SIGNER')])
      expect(await contributionsOf(peter)).toHaveLength(0)
    })
  })

  describe('outcome C', () => {
    it('suspicion: nothing is booked, the member reads the neutral note, the moderation the reason', async () => {
      firstCreationLines.mockResolvedValue(
        answer(['für etwas'], true, 'Gewaltverherrlichung in Eintrag 0'),
      )
      await loginAs('raeuber@hotzenplotz.de')
      const { data, errors } = await mutate({
        mutation: submitFirstCreation,
        variables: {
          entries: [{ catalogKey: 'helpedAtHome', text: 'etwas Schlimmes getan habe' }],
        },
      })
      expect(errors).toBeUndefined()
      const review = 'Deine Einträge schaut sich noch ein Mensch an. Du hörst von uns.'
      expect(data.submitFirstCreation).toMatchObject({
        state: FirstCreationStatus.IN_REVIEW,
        eligible: false,
        message: review,
        entries: [
          {
            memo: 'Ich habe zu Hause mitgeholfen, indem ich etwas Schlimmes getan habe',
            confirmed: false,
            status: 'IN_PROGRESS',
          },
        ],
      })
      const [contribution] = await contributionsOf(raeuber)
      expect(contribution).toMatchObject({
        contributionStatus: ContributionStatus.IN_PROGRESS,
        confirmedAt: null,
      })
      expect(contribution.amount.toString()).toBe('100')
      const messages = await messagesOn(contribution.id)
      expect(messages.map((m) => [m.type, m.message])).toEqual([
        [ContributionMessageType.DIALOG, review],
        [
          ContributionMessageType.MODERATOR,
          'Crea hat bei der Erst-Schöpfung angehalten: Gewaltverherrlichung in Eintrag 0. Bitte prüfen und von Hand bestätigen, ändern oder ablehnen.',
        ],
      ])
      expect(addedMessageMail).toHaveBeenCalledTimes(1)
      expect(confirmedMail).not.toHaveBeenCalled()
      expect(await rowOf(raeuber)).toMatchObject({
        status: FirstCreationStatus.IN_REVIEW,
        reviewReason: FirstCreationReviewReason.SUSPICION,
        message: review,
        signerUserId: peter.id,
      })
      expect(await eventsOf(EventType.FIRST_CREATION_REVIEW, raeuber)).toHaveLength(1)
    })

    it('timeout: same path, no internal note, the reason on the row', async () => {
      // The same member once more, reopened the way the function test will do it.
      await reopen(raeuber, FirstCreationTestMode.WITH_BOOKING)
      firstCreationLines.mockResolvedValue({
        success: false,
        error: { reason: 'MODEL_TIMEOUT', message: 'FIRST_CREATION_MODEL_TIMEOUT' },
      })
      await loginAs('raeuber@hotzenplotz.de')
      const before = (await contributionsOf(raeuber)).length
      const { data } = await mutate({
        mutation: submitFirstCreation,
        variables: {
          entries: [
            { catalogKey: 'supportedClub', text: 'Bäume gepflanzt habe' },
            { catalogKey: 'retiree' },
          ],
        },
      })
      expect(data.submitFirstCreation.state).toBe(FirstCreationStatus.IN_REVIEW)
      const fresh = (await contributionsOf(raeuber)).slice(before)
      expect(fresh).toHaveLength(2)
      expect(fresh.map((c) => c.confirmedAt)).toEqual([null, null])
      expect(await messagesOn(fresh[0].id)).toHaveLength(1)
      expect(confirmedMail).not.toHaveBeenCalled()
      expect(await rowOf(raeuber)).toMatchObject({
        status: FirstCreationStatus.IN_REVIEW,
        reviewReason: FirstCreationReviewReason.MODEL_TIMEOUT,
        contributionIds: fresh.map((c) => c.id),
      })
    })
  })

  describe('reopened by the function test (FORCED)', () => {
    it('outcome B: without booking, the thread and the mail come, the confirms do not', async () => {
      await reopen(bibi, FirstCreationTestMode.WITHOUT_BOOKING)
      firstCreationLines.mockResolvedValue(answer(['für die Pizzakartons']))
      await loginAs('bibi@bloxberg.de')
      const before = (await contributionsOf(bibi)).length
      const status = await query({ query: firstCreationStatus })
      expect(status.data.firstCreationStatus).toMatchObject({
        state: FirstCreationStatus.FORCED,
        eligible: true,
      })
      const { data, errors } = await mutate({
        mutation: submitFirstCreation,
        variables: {
          entries: [{ catalogKey: 'helpedAtHome', text: 'die Pizzakartons getragen hab' }],
        },
      })
      expect(errors).toBeUndefined()
      expect(data.submitFirstCreation).toMatchObject({
        state: FirstCreationStatus.DONE_UNBOOKED,
        entries: [{ memo: expect.stringContaining('Pizzakartons'), confirmed: false }],
      })
      expect(data.submitFirstCreation.message).toContain('für die Pizzakartons.')
      const contributions = await contributionsOf(bibi)
      expect(contributions).toHaveLength(before + 1)
      const fresh = contributions[contributions.length - 1]
      expect(fresh).toMatchObject({
        contributionStatus: ContributionStatus.IN_PROGRESS,
        confirmedAt: null,
      })
      expect(fresh.amount.toString()).toBe('100')
      expect(await messagesOn(fresh.id)).toHaveLength(1)
      expect(addedMessageMail).toHaveBeenCalledTimes(1)
      expect(confirmedMail).not.toHaveBeenCalled()
      // The SAME row, moved on: still one row per member.
      const row = await rowOf(bibi)
      expect(row).toMatchObject({
        status: FirstCreationStatus.DONE_UNBOOKED,
        entriesCount: 1,
        contributionIds: [fresh.id],
        testMode: FirstCreationTestMode.WITHOUT_BOOKING,
      })
      expect(await eventsOf(EventType.FIRST_CREATION_UNBOOKED, bibi)).toHaveLength(1)
    })

    it('splits seven entries into 14,32 + six times 14,28 and books all seven', async () => {
      await reopen(bibi, FirstCreationTestMode.WITH_BOOKING)
      firstCreationLines.mockResolvedValue(
        answer(Array.from({ length: 7 }, (_, i) => `für Ding ${i}`)),
      )
      await loginAs('bibi@bloxberg.de')
      const before = (await contributionsOf(bibi)).length
      const { data } = await mutate({
        mutation: submitFirstCreation,
        variables: {
          entries: Array.from({ length: 7 }, (_, i) => ({
            catalogKey: 'helpedAtHome',
            text: `Ding ${i} getan habe`,
          })),
        },
      })
      expect(data.submitFirstCreation.state).toBe(FirstCreationStatus.DONE)
      const fresh = (await contributionsOf(bibi)).slice(before)
      expect(fresh.map((c) => c.amount.toString())).toEqual([
        '14.32',
        '14.28',
        '14.28',
        '14.28',
        '14.28',
        '14.28',
        '14.28',
      ])
      expect(fresh.every((c) => c.confirmedAt !== null)).toBe(true)
      expect(confirmedMail).toHaveBeenCalledTimes(7)
    })

    it('keeps a thanked bundle thanked when only the outcome event fails', async () => {
      await reopen(bibi, FirstCreationTestMode.WITH_BOOKING)
      firstCreationLines.mockResolvedValue(answer(['für den Zaun']))
      doneEvent.mockRejectedValueOnce(new Error('event store down'))
      await loginAs('bibi@bloxberg.de')
      const reviewsBefore = (await eventsOf(EventType.FIRST_CREATION_REVIEW, bibi)).length
      const { data, errors } = await mutate({
        mutation: submitFirstCreation,
        variables: {
          entries: [{ catalogKey: 'helpedNeighbourhood', text: 'den Zaun repariert habe' }],
        },
      })
      expect(errors).toBeUndefined()
      // Booked and thanked - and it stays that way: no second, contradicting note.
      expect(data.submitFirstCreation.state).toBe(FirstCreationStatus.DONE)
      expect(data.submitFirstCreation.message).toContain('für den Zaun')
      expect(addedMessageMail).toHaveBeenCalledTimes(1)
      expect(confirmedMail).toHaveBeenCalledTimes(1)
      expect((await rowOf(bibi)).status).toBe(FirstCreationStatus.DONE)
      // The process is not counted under a second outcome.
      expect(await eventsOf(EventType.FIRST_CREATION_REVIEW, bibi)).toHaveLength(reviewsBefore)
    })

    it('refuses more than ten entries before filing anything', async () => {
      await reopen(bibi, FirstCreationTestMode.WITH_BOOKING)
      await loginAs('bibi@bloxberg.de')
      const before = (await contributionsOf(bibi)).length
      const { errors } = await mutate({
        mutation: submitFirstCreation,
        variables: {
          entries: Array.from({ length: 11 }, () => ({
            catalogKey: 'helpedAtHome',
            text: 'x getan habe',
          })),
        },
      })
      expect(errors).toEqual([new GraphQLError('FIRST_CREATION_ENTRIES_INVALID: TOO_MANY')])
      expect(await contributionsOf(bibi)).toHaveLength(before)
    })

    it('refuses to start when the month cannot take another 100 GDD (ES-015)', async () => {
      // Whatever Bibi's earlier runs in this file left in the month (open ones count too),
      // top the month up to 50 GDD free: then 100 no longer fit. Measured, not assumed, so
      // an earlier test failing or a new run above does not turn this into a false red.
      const now = new Date()
      const thisMonth = (await contributionsOf(bibi)).filter(
        (c) =>
          !c.deletedAt &&
          c.contributionStatus !== ContributionStatus.DENIED &&
          c.contributionDate.getUTCFullYear() === now.getUTCFullYear() &&
          c.contributionDate.getUTCMonth() === now.getUTCMonth(),
      )
      const used = thisMonth.reduce((sum, c) => sum.add(c.amount), new GradidoUnit(0n))
      const topUp = Number((GradidoUnit.fromNumber(950).subtract(used).gddCent / 10000n).toString())
      expect(topUp).toBeGreaterThan(0)
      await creationFactory(testEnv, {
        email: 'bibi@bloxberg.de',
        amount: topUp,
        memo: 'Aufgefuellt bis kurz unter die Grenze',
        contributionDate: new Date().toISOString(),
        confirmed: true,
      })
      await loginAs('bibi@bloxberg.de')
      const before = (await contributionsOf(bibi)).length
      const { errors } = await mutate({
        mutation: submitFirstCreation,
        variables: { entries: [{ catalogKey: 'retiree' }] },
      })
      expect(errors).toEqual([new GraphQLError('FIRST_CREATION_QUOTA_EXCEEDED')])
      expect(await contributionsOf(bibi)).toHaveLength(before)
      expect(firstCreationLines).not.toHaveBeenCalled()
    })
  })

  describe('two tabs, one Save each', () => {
    it('refuses the second while the first is still with the model', async () => {
      // Bob is a moderator but not the signer, so he may run his own first creation.
      let release: (value: unknown) => void = () => undefined
      firstCreationLines.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release = resolve
          }),
      )
      await loginAs('bob@baumeister.de')
      const first = mutate({
        mutation: submitFirstCreation,
        variables: { entries: [{ catalogKey: 'helpedAtHome', text: 'gebaut habe' }] },
      })
      // Wait until the first request holds the lock and sits in the model call.
      for (let i = 0; i < 200 && firstCreationLines.mock.calls.length === 0; i++) {
        await new Promise((resolve) => setTimeout(resolve, 25))
      }
      expect(firstCreationLines).toHaveBeenCalledTimes(1)
      const second = await mutate({
        mutation: submitFirstCreation,
        variables: { entries: [{ catalogKey: 'helpedAtHome', text: 'gebaut habe' }] },
      })
      expect(second.errors).toEqual([new GraphQLError('FIRST_CREATION_ALREADY_RUNNING')])
      release(answer(['für das Gebaute']))
      const { data } = await first
      expect(data.submitFirstCreation.state).toBe(FirstCreationStatus.DONE)
      expect(await contributionsOf(bob)).toHaveLength(1)
    })
  })

  describe('healing a process that broke between filing and confirming', () => {
    const drizzle = () => AppDatabase.getInstance().getDrizzleDataSource()

    it('reads DONE when every contribution turned out confirmed', async () => {
      // Bob's process is DONE; put it back to SUBMITTED as if the last update had been lost.
      const row = await rowOf(bob)
      await drizzle()
        .update(firstCreationsTable)
        .set({
          status: FirstCreationStatus.SUBMITTED,
          updatedAt: new Date(Date.now() - 6 * 60 * 1000),
        })
        .where(eq(firstCreationsTable.id, row.id))
      await loginAs('bob@baumeister.de')
      const { data } = await query({ query: firstCreationStatus })
      expect(data.firstCreationStatus.state).toBe(FirstCreationStatus.DONE)
      expect((await rowOf(bob)).status).toBe(FirstCreationStatus.DONE)
    })

    it('leaves a young SUBMITTED row alone and hands a stale one to a human', async () => {
      // Raeuber's contributions are open (IN_REVIEW above); stage a SUBMITTED row on them.
      const row = await rowOf(raeuber)
      await drizzle()
        .update(firstCreationsTable)
        .set({
          status: FirstCreationStatus.SUBMITTED,
          reviewReason: null,
          message: null,
          updatedAt: new Date(),
        })
        .where(eq(firstCreationsTable.id, row.id))
      await loginAs('raeuber@hotzenplotz.de')
      const young = await query({ query: firstCreationStatus })
      expect(young.data.firstCreationStatus.state).toBe(FirstCreationStatus.SUBMITTED)

      await drizzle()
        .update(firstCreationsTable)
        .set({ updatedAt: new Date(Date.now() - 6 * 60 * 1000) })
        .where(eq(firstCreationsTable.id, row.id))
      const messagesBefore = (await messagesOn(row.contributionIds[0])).length
      // While somebody holds the member's lock the row is alive, however old it looks.
      const held = new Mutex(
        AppDatabase.getInstance().getRedisClient(),
        `FIRST_CREATION_LOCK:${raeuber.id}`,
      )
      expect(await held.tryAcquire()).toBe(true)
      const alive = await query({ query: firstCreationStatus })
      expect(alive.data.firstCreationStatus.state).toBe(FirstCreationStatus.SUBMITTED)
      expect(await messagesOn(row.contributionIds[0])).toHaveLength(messagesBefore)
      await held.release()
      const stale = await query({ query: firstCreationStatus })
      expect(stale.data.firstCreationStatus).toMatchObject({
        state: FirstCreationStatus.IN_REVIEW,
        message: 'Deine Einträge schaut sich noch ein Mensch an. Du hörst von uns.',
      })
      expect(await rowOf(raeuber)).toMatchObject({
        status: FirstCreationStatus.IN_REVIEW,
        reviewReason: FirstCreationReviewReason.PROCESS_ERROR,
      })
      // The review note went onto the thread once more, in the signer's name.
      const messages = await messagesOn(row.contributionIds[0])
      expect(messages).toHaveLength(messagesBefore + 1)
      expect(messages[messages.length - 1]).toMatchObject({
        userId: peter.id,
        type: ContributionMessageType.DIALOG,
      })
    })
  })

  describe('when the process breaks after the row is claimed', () => {
    it('a confirm failing mid-bundle lands in review with the note on the first open contribution', async () => {
      await reopen(raeuber, FirstCreationTestMode.WITH_BOOKING)
      firstCreationLines.mockResolvedValue(answer(['für eins', 'für zwei', 'für drei']))
      // The mail after the SECOND booking fails: that contribution is committed, the third
      // is never reached.
      confirmedMail.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('smtp down'))
      await loginAs('raeuber@hotzenplotz.de')
      const before = (await contributionsOf(raeuber)).length
      const reviewsBefore = (await eventsOf(EventType.FIRST_CREATION_REVIEW, raeuber)).length
      const { data, errors } = await mutate({
        mutation: submitFirstCreation,
        variables: {
          entries: [1, 2, 3].map((n) => ({
            catalogKey: 'helpedAtHome',
            text: `Ding ${n} getan habe`,
          })),
        },
      })
      expect(errors).toBeUndefined()
      expect(data.submitFirstCreation).toMatchObject({
        state: FirstCreationStatus.IN_REVIEW,
        message: 'Deine Einträge schaut sich noch ein Mensch an. Du hörst von uns.',
      })
      const fresh = (await contributionsOf(raeuber)).slice(before)
      expect(fresh.map((c) => c.confirmedAt !== null)).toEqual([true, true, false])
      // The note sits on the one still open, because the booked ones take no message.
      expect(await messagesOn(fresh[2].id)).toHaveLength(1)
      expect((await messagesOn(fresh[2].id))[0].message).toContain('noch ein Mensch')
      // Thanks note on the first, review note on the third: two mails, no more.
      expect(addedMessageMail).toHaveBeenCalledTimes(2)
      expect(await rowOf(raeuber)).toMatchObject({
        status: FirstCreationStatus.IN_REVIEW,
        reviewReason: FirstCreationReviewReason.PROCESS_ERROR,
        contributionIds: fresh.map((c) => c.id),
      })
      expect(await eventsOf(EventType.FIRST_CREATION_REVIEW, raeuber)).toHaveLength(
        reviewsBefore + 1,
      )
    })

    it('a failing entry leaves the ones before it on the row, in review, with a note', async () => {
      await reopen(raeuber, FirstCreationTestMode.WITH_BOOKING)
      let calls = 0
      fileOne.mockImplementation((...args: unknown[]) => {
        calls += 1
        if (calls === 2) {
          throw new Error('database hiccup')
        }
        return realFileOne(...args)
      })
      await loginAs('raeuber@hotzenplotz.de')
      const before = (await contributionsOf(raeuber)).length
      const { data, errors } = await mutate({
        mutation: submitFirstCreation,
        variables: {
          entries: [1, 2, 3].map((n) => ({
            catalogKey: 'helpedAtHome',
            text: `Sache ${n} getan habe`,
          })),
        },
      })
      fileOne.mockImplementation(realFileOne)
      expect(errors).toBeUndefined()
      expect(data.submitFirstCreation.state).toBe(FirstCreationStatus.IN_REVIEW)
      const fresh = (await contributionsOf(raeuber)).slice(before)
      expect(fresh).toHaveLength(1)
      expect(await messagesOn(fresh[0].id)).toHaveLength(1)
      expect(await rowOf(raeuber)).toMatchObject({
        status: FirstCreationStatus.IN_REVIEW,
        reviewReason: FirstCreationReviewReason.PROCESS_ERROR,
        contributionIds: [fresh[0].id],
      })
      expect(firstCreationLines).not.toHaveBeenCalled()
      // The window is not shut for good: the row is there, the moderation sees the bundle.
      const status = await query({ query: firstCreationStatus })
      expect(status.data.firstCreationStatus).toMatchObject({
        state: FirstCreationStatus.IN_REVIEW,
        eligible: false,
      })
    })

    it('a review whose event fails still writes the note exactly once', async () => {
      await reopen(raeuber, FirstCreationTestMode.WITH_BOOKING)
      firstCreationLines.mockResolvedValue(answer(['für etwas'], true, 'Grund'))
      reviewEvent.mockRejectedValueOnce(new Error('event store down'))
      await loginAs('raeuber@hotzenplotz.de')
      const before = (await contributionsOf(raeuber)).length
      const { data } = await mutate({
        mutation: submitFirstCreation,
        variables: { entries: [{ catalogKey: 'helpedAtHome', text: 'etwas getan habe' }] },
      })
      expect(data.submitFirstCreation.state).toBe(FirstCreationStatus.IN_REVIEW)
      const [fresh] = (await contributionsOf(raeuber)).slice(before)
      const messages = await messagesOn(fresh.id)
      expect(messages.map((m) => m.type)).toEqual([
        ContributionMessageType.DIALOG,
        ContributionMessageType.MODERATOR,
      ])
      expect(addedMessageMail).toHaveBeenCalledTimes(1)
      expect((await rowOf(raeuber)).reviewReason).toBe(FirstCreationReviewReason.SUSPICION)
    })

    it('a model call that throws is a model failure, not an error to the member', async () => {
      await reopen(bob, FirstCreationTestMode.WITH_BOOKING)
      firstCreationLines.mockRejectedValue(new Error('settings table unreachable'))
      await loginAs('bob@baumeister.de')
      const { data, errors } = await mutate({
        mutation: submitFirstCreation,
        variables: { entries: [{ catalogKey: 'helpedAtHome', text: 'gebaut habe' }] },
      })
      expect(errors).toBeUndefined()
      expect(data.submitFirstCreation.state).toBe(FirstCreationStatus.IN_REVIEW)
      expect((await rowOf(bob)).reviewReason).toBe(FirstCreationReviewReason.MODEL_ERROR)
    })
  })

  describe('who is kept out', () => {
    let garrick: DbUser

    beforeAll(async () => {
      // Confirmed so that a password exists; the two tests below change what they need.
      garrick = await userFactory(testEnv, {
        ...garrickOllivander,
        emailChecked: true,
        language: 'fr',
      })
    })

    it('a member whose language has no catalog yet sees no window', async () => {
      await loginAs('garrick@ollivander.com')
      const { data } = await query({ query: firstCreationStatus })
      expect(data.firstCreationStatus).toMatchObject({ state: 'NONE', eligible: false })
      const { errors } = await mutate({
        mutation: submitFirstCreation,
        variables: { entries: [{ catalogKey: 'retiree' }] },
      })
      expect(errors).toEqual([new GraphQLError('FIRST_CREATION_NOT_ELIGIBLE: NO_CATALOG')])
      expect(await contributionsOf(garrick)).toHaveLength(0)
    })

    it('an unconfirmed address past the grace period is refused like every other value-creating call', async () => {
      await DbUser.update(
        { id: garrick.id },
        { language: 'de', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      )
      await DbUserContact.update({ id: garrick.emailId ?? 0 }, { emailChecked: false })
      await loginAs('garrick@ollivander.com')
      const status = await query({ query: firstCreationStatus })
      expect(status.errors).toEqual([new GraphQLError('401 Unauthorized')])
      const { errors } = await mutate({
        mutation: submitFirstCreation,
        variables: { entries: [{ catalogKey: 'retiree' }] },
      })
      expect(errors).toEqual([new GraphQLError('401 Unauthorized')])
      expect(await contributionsOf(garrick)).toHaveLength(0)
    })

    it('an omitted signer argument is refused rather than read as somebody', async () => {
      await loginAs('peter@lustig.de')
      const { errors } = await mutate({ mutation: setFirstCreationSigner, variables: {} })
      expect(errors).toEqual([new GraphQLError('FIRST_CREATION_SIGNER_ARGUMENT_MISSING')])
      const settings = await query({ query: creaSettings })
      expect(settings.data.creaSettings.firstCreationSigner).toMatchObject({ userId: peter.id })
    })
  })

  describe('clearing the signer', () => {
    it('shuts the window again', async () => {
      await loginAs('peter@lustig.de')
      const { data } = await mutate({
        mutation: setFirstCreationSigner,
        variables: { userId: null },
      })
      expect(data.setFirstCreationSigner).toBeNull()
      const settings = await query({ query: creaSettings })
      expect(settings.data.creaSettings.firstCreationSigner).toBeNull()
      // Bob never finished a process the window would count as "started" for eligibility -
      // he did (DONE); so ask a fresh reading of somebody with a row: eligible is false for
      // everybody now, and the state is still readable.
      await loginAs('bob@baumeister.de')
      const status = await query({ query: firstCreationStatus })
      // Whatever Bob's row says after the runs above, it is a row - and no signer means no
      // window for anybody who has one.
      expect(status.data.firstCreationStatus.state).not.toBe('NONE')
      expect(status.data.firstCreationStatus.eligible).toBe(false)
    })
  })
})
