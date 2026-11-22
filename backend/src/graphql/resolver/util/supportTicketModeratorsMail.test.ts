// AI-GENERATED — not an architecture reference
// A unit test that runs under jest and bun alike (AGENTS.md): the role holders, the mail and the
// log are fakes before jest.mock, the module under test is imported in beforeAll. The rule of the
// recipients is the real one (SupportTicket.logic), and so is the reading of a scope
// (describeModeratorCreationGroups). The whole way, with a database, is held in
// SupportTicketResolver.test.ts and SupportTicketModerationResolver.test.ts.
import type { RoleHolderWithContact } from 'database'
import type { SupportTicketModeratorsMail } from './supportTicketModeratorsMail'

const mockLogger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const mockDatabase = {
  dbSelectRoleHoldersWithContact: jest.fn(),
  // named only so that the modules of the scope load under Bun, which links named imports;
  // nothing here reads them
  AppDatabase: {},
  Contribution: {},
  CreationGroup: {},
  UserRole: {},
  // only the values read
  RoleNames: {
    ADMIN: 'ADMIN',
    MODERATOR: 'MODERATOR',
    MODERATOR_AI: 'MODERATOR_AI',
    USER: 'USER',
    UNAUTHORIZED: 'UNAUTHORIZED',
    DLT_CONNECTOR: 'DLT_CONNECTOR_ROLE',
  },
}
const mockCore = {
  // the real rule: a report of the transport, no null, no Error, no false
  chatMailWentOut: (result: unknown) => Boolean(result) && !(result instanceof Error),
  databaseErrorCode: (error: unknown) => (error as { code?: string }).code ?? 'UNKNOWN',
  sendNewSupportTicketEmail: jest.fn(),
}

// addLayout and configure: `shared` loads the logging set-up of config-schema, which calls both
jest.mock('log4js', () => ({
  getLogger: () => mockLogger,
  addLayout: jest.fn(),
  configure: jest.fn(),
}))
jest.mock('database', () => mockDatabase)
jest.mock('core', () => mockCore)

type MailModule = typeof import('./supportTicketModeratorsMail')
let readSupportTicketMailRecipients: MailModule['readSupportTicketMailRecipients']
let mailModeratorsOfSupportTicket: MailModule['mailModeratorsOfSupportTicket']

// the moderators with the tick "may handle support requests" (K6), the administrator without it:
// an administrator handles requests anyway
const holder = (
  userId: number,
  role: string,
  visibleCreationGroups: string | null,
  firstName: string,
  language = 'de',
  supportDuty = true,
  handledSupportGroups: string | null = null,
): RoleHolderWithContact => ({
  userId,
  role,
  visibleCreationGroups,
  supportDuty,
  handledSupportGroups,
  firstName,
  lastName: 'Test',
  language,
  email: `${firstName.toLowerCase()}@example.org`,
})
const peter = holder(1, 'ADMIN', null, 'Peter', 'de', false)
const bob = holder(11, 'MODERATOR', '["garden"]', 'Bob', 'fr')
const raeuber = holder(12, 'MODERATOR', '["*untagged"]', 'Raeuber')
const dora = holder(13, 'MODERATOR', '["choir","*untagged"]', 'Dora')
const carla = holder(14, 'MODERATOR_AI', null, 'Carla', 'ru')
const ids = (recipients: RoleHolderWithContact[]) => recipients.map(({ userId }) => userId)

const mail: SupportTicketModeratorsMail = {
  supportTicketId: 42,
  recipients: [bob, carla],
  actorAlias: 'BBB',
  groupName: 'Garten',
  reassigned: false,
}

// everything the log got, as one text: numbers and codes, never a name, an address or a group's name
const logged = () =>
  JSON.stringify(
    [mockLogger.debug, mockLogger.info, mockLogger.warn, mockLogger.error].flatMap(
      (level) => level.mock.calls,
    ),
  )

const HOUR = 60 * 60 * 1000
// each test two hours after the one before, so that the cap of one does not reach the next
let clock = Date.parse('2026-11-14T08:00:00.000Z')
const timeIs = (ms: number) => jest.spyOn(Date, 'now').mockReturnValue(ms)

beforeAll(async () => {
  ;({ readSupportTicketMailRecipients, mailModeratorsOfSupportTicket } = await import(
    './supportTicketModeratorsMail'
  ))
})

beforeEach(() => {
  jest.resetAllMocks()
  clock += 2 * HOUR
  timeIs(clock)
  mockDatabase.dbSelectRoleHoldersWithContact.mockResolvedValue([peter, bob, raeuber, dora, carla])
  mockCore.sendNewSupportTicketEmail.mockResolvedValue({ messageId: 'sent' })
})

describe('readSupportTicketMailRecipients', () => {
  // the staircase of the rule (SUA-027): the group's own, else who sees everything, else admins
  it('finds, for a request of a group, its moderators', async () => {
    expect(ids(await readSupportTicketMailRecipients('garden', []))).toEqual([11])
    expect(ids(await readSupportTicketMailRecipients('choir', []))).toEqual([13])
    expect(mockDatabase.dbSelectRoleHoldersWithContact).toHaveBeenCalledTimes(2)
  })

  it('finds, for a request without a group, those with "no group"', async () => {
    expect(ids(await readSupportTicketMailRecipients(null, []))).toEqual([12, 13])
  })

  it('finds those who see everything for a group without moderators of its own', async () => {
    expect(ids(await readSupportTicketMailRecipients('orchard', []))).toEqual([14])
  })

  it('finds the administrators where no moderator is left', async () => {
    mockDatabase.dbSelectRoleHoldersWithContact.mockResolvedValue([peter, bob])
    expect(ids(await readSupportTicketMailRecipients('garden', [11]))).toEqual([1])
  })

  it('never finds the asking member', async () => {
    expect(ids(await readSupportTicketMailRecipients('garden', [11]))).toEqual([14])
  })

  it('asks the right of a role, not its name: a role without it finds nobody, ticked or not', async () => {
    mockDatabase.dbSelectRoleHoldersWithContact.mockResolvedValue([
      holder(21, 'USER', null, 'Uta'),
      holder(22, 'DLT_CONNECTOR_ROLE', null, 'Dirk'),
    ])
    expect(await readSupportTicketMailRecipients('garden', [])).toEqual([])
  })

  // the tick of K6 (SUA-025): a moderator without it handles no request, so no mail reaches them --
  // the step goes on as if they were not there
  it('finds no moderator without the tick, also where the group is theirs', async () => {
    const bobWithout = { ...bob, supportDuty: false }
    const carlaWithout = { ...carla, supportDuty: false }
    mockDatabase.dbSelectRoleHoldersWithContact.mockResolvedValue([
      peter,
      bobWithout,
      raeuber,
      dora,
      carla,
    ])
    expect(ids(await readSupportTicketMailRecipients('garden', []))).toEqual([14])
    mockDatabase.dbSelectRoleHoldersWithContact.mockResolvedValue([peter, bobWithout, carlaWithout])
    expect(ids(await readSupportTicketMailRecipients('garden', []))).toEqual([1])
  })

  it('finds an administrator without the tick', async () => {
    // The fixture proves itself: peter's row carries no tick.
    expect(peter.supportDuty).toBe(false)
    mockDatabase.dbSelectRoleHoldersWithContact.mockResolvedValue([peter])
    expect(ids(await readSupportTicketMailRecipients(null, []))).toEqual([1])
  })

  // MG5: an administrator who switched the support off in "Meine Gruppen" is left out -- and where
  // every administrator did, all of them are mailed all the same (Bernd, 22.11.2026)
  it('leaves out an administrator who switched the support off, and mails all where all did', async () => {
    const off = JSON.stringify({ groupIds: [], untagged: false, off: true })
    const peterOff = { ...peter, handledSupportGroups: off }
    const ada = holder(2, 'ADMIN', null, 'Ada', 'de', false)
    mockDatabase.dbSelectRoleHoldersWithContact.mockResolvedValue([peterOff, ada])
    expect(ids(await readSupportTicketMailRecipients('orchard', []))).toEqual([2])
    mockDatabase.dbSelectRoleHoldersWithContact.mockResolvedValue([
      peterOff,
      { ...ada, handledSupportGroups: off },
    ])
    expect(ids(await readSupportTicketMailRecipients('orchard', []))).toEqual([1, 2])
  })

  // the ticks alone steer no mail: what is on handles, whichever groups it names
  it('mails an administrator who ticked groups in "Meine Gruppen", also for another group', async () => {
    const ticked = JSON.stringify({ groupIds: [7], untagged: false })
    mockDatabase.dbSelectRoleHoldersWithContact.mockResolvedValue([
      { ...peter, handledSupportGroups: ticked },
    ])
    expect(ids(await readSupportTicketMailRecipients('orchard', []))).toEqual([1])
  })

  // the switch is an administrator's: in a moderator's row it is what a role before left there
  it('mails a moderator whatever their row says of "Meine Gruppen", with a scope and without', async () => {
    const off = JSON.stringify({ groupIds: [], untagged: false, off: true })
    const bobOff = { ...bob, handledSupportGroups: off }
    const carlaOff = { ...carla, handledSupportGroups: off }
    mockDatabase.dbSelectRoleHoldersWithContact.mockResolvedValue([peter, bobOff, carlaOff])
    expect(ids(await readSupportTicketMailRecipients('garden', []))).toEqual([11])
    expect(ids(await readSupportTicketMailRecipients('orchard', []))).toEqual([carla.userId])
  })

  it('throws not where the reading fails: nobody, and the code in the log', async () => {
    mockDatabase.dbSelectRoleHoldersWithContact.mockRejectedValue(
      Object.assign(new Error('select … bob@example.org'), { code: 'ER_LOCK_WAIT_TIMEOUT' }),
    )
    await expect(readSupportTicketMailRecipients('garden', [])).resolves.toEqual([])
    expect(mockLogger.error).toHaveBeenCalledWith(
      'support moderators not read (ER_LOCK_WAIT_TIMEOUT)',
    )
    expect(logged()).not.toContain('bob@example.org')
  })
})

describe('mailModeratorsOfSupportTicket', () => {
  it('mails each recipient in their language: who asked, the number and the group, nothing more', async () => {
    await mailModeratorsOfSupportTicket(mail)
    expect(mockCore.sendNewSupportTicketEmail.mock.calls).toEqual([
      [
        {
          firstName: 'Bob',
          lastName: 'Test',
          email: 'bob@example.org',
          language: 'fr',
          actorAlias: 'BBB',
          supportTicketNumber: 42,
          groupName: 'Garten',
          reassigned: false,
        },
      ],
      [
        {
          firstName: 'Carla',
          lastName: 'Test',
          email: 'carla@example.org',
          language: 'ru',
          actorAlias: 'BBB',
          supportTicketNumber: 42,
          groupName: 'Garten',
          reassigned: false,
        },
      ],
    ])
  })

  it('says it was handed on where it was', async () => {
    await mailModeratorsOfSupportTicket({ ...mail, reassigned: true, actorAlias: 'MeisterBob' })
    expect(mockCore.sendNewSupportTicketEmail).toHaveBeenCalledWith(
      expect.objectContaining({ reassigned: true, actorAlias: 'MeisterBob' }),
    )
  })

  it('goes on after a mail that failed, and never rejects', async () => {
    mockCore.sendNewSupportTicketEmail
      .mockRejectedValueOnce(Object.assign(new Error('bob@example.org'), { code: 'EENVELOPE' }))
      .mockResolvedValueOnce({ messageId: 'sent' })
    await expect(mailModeratorsOfSupportTicket(mail)).resolves.toBeUndefined()
    expect(mockCore.sendNewSupportTicketEmail).toHaveBeenCalledTimes(2)
    expect(mockLogger.error).toHaveBeenCalledWith(
      'support moderators mail failed: support_ticket_id=42 (EENVELOPE)',
    )
    expect(mockLogger.info).toHaveBeenLastCalledWith(
      'support moderators mail: support_ticket_id=42 sent=1 of 2',
    )
  })

  it('counts no mail that did not go out: switched off, refused, nothing back', async () => {
    mockCore.sendNewSupportTicketEmail
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(new Error('refused'))
    await mailModeratorsOfSupportTicket(mail)
    expect(mockLogger.info).toHaveBeenLastCalledWith(
      'support moderators mail: support_ticket_id=42 sent=0 of 2',
    )
  })

  it('mails nobody without recipients, and that counts nothing towards the cap', async () => {
    for (let request = 0; request < 30; request++) {
      await mailModeratorsOfSupportTicket({ ...mail, recipients: [] })
    }
    expect(mockCore.sendNewSupportTicketEmail).not.toHaveBeenCalled()
    await mailModeratorsOfSupportTicket(mail)
    expect(mockCore.sendNewSupportTicketEmail).toHaveBeenCalledTimes(2)
  })

  it('lets twenty requests of an hour start mails, not the twenty-first, and an hour later again', async () => {
    for (let request = 1; request <= 20; request++) {
      timeIs(clock + request * 1000)
      await mailModeratorsOfSupportTicket({ ...mail, supportTicketId: request })
    }
    expect(mockCore.sendNewSupportTicketEmail).toHaveBeenCalledTimes(40)
    timeIs(clock + 30 * 60 * 1000)
    await mailModeratorsOfSupportTicket({ ...mail, supportTicketId: 21 })
    expect(mockCore.sendNewSupportTicketEmail).toHaveBeenCalledTimes(40)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'support moderators mail not sent: support_ticket_id=21 hourly cap reached',
    )
    // an hour after the first of them, that one counts no more
    timeIs(clock + HOUR + 1000)
    await mailModeratorsOfSupportTicket({ ...mail, supportTicketId: 22 })
    expect(mockCore.sendNewSupportTicketEmail).toHaveBeenCalledTimes(42)
  })

  it('logs the number of the request, counts and codes, never a name, an address or a group', async () => {
    await mailModeratorsOfSupportTicket(mail)
    mockCore.sendNewSupportTicketEmail.mockRejectedValue(new Error('no: carla@example.org'))
    await mailModeratorsOfSupportTicket(mail)
    expect(logged()).toContain('support_ticket_id=42')
    for (const secret of [
      'Bob',
      'Carla',
      'bob@example.org',
      'carla@example.org',
      'Garten',
      'BBB',
    ]) {
      expect([secret, logged().includes(secret)]).toEqual([secret, false])
    }
  })
})
