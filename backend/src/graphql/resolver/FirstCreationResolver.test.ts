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
import { AnthropicClient } from '@/apis/anthropic/AnthropicClient'
import { composeFirstCreationGreeting } from '@/data/FirstCreation.logic'
import { EventType } from '@/event/Events'
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
        expect.objectContaining({ errors: [new GraphQLError('FIRST_CREATION_SIGNER_NOT_FOUND')] }),
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
        { memo: expect.stringContaining('Gemeindefest'), confirmed: true },
        { memo: expect.stringContaining('Nachbarskinder'), confirmed: true },
        { memo: 'Ich bin Rentnerin / Rentner.', confirmed: true },
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
      // Bibi has 300 GDD this month from the three runs above (the unbooked one counts too,
      // its contributions are open); 650 more leaves 50 free, and 100 no longer fit.
      await creationFactory(testEnv, {
        email: 'bibi@bloxberg.de',
        amount: 650,
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
        .set({ status: FirstCreationStatus.SUBMITTED })
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
      const stale = await query({ query: firstCreationStatus })
      expect(stale.data.firstCreationStatus).toMatchObject({
        state: FirstCreationStatus.IN_REVIEW,
        message: 'Deine Einträge schaut sich noch ein Mensch an. Du hörst von uns.',
      })
      expect(await rowOf(raeuber)).toMatchObject({
        status: FirstCreationStatus.IN_REVIEW,
        reviewReason: FirstCreationReviewReason.MODEL_ERROR,
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
      expect(status.data.firstCreationStatus).toMatchObject({
        state: FirstCreationStatus.DONE,
        eligible: false,
      })
    })
  })
})
