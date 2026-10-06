// AI-GENERATED — not an architecture reference
jest.mock('database', () => ({
  ...jest.requireActual('database'),
  dbCountUnconfirmedVouchedAccounts: jest.fn(),
  dbFindContributionLinkIdByCode: jest.fn(),
  dbFindLocalUserByAlias: jest.fn(),
  dbFindProjectBrandingByAlias: jest.fn(),
  dbFindTransactionLinkByCode: jest.fn(),
  dbFindTransactionLinkWithOwner: jest.fn(),
  dbFindUserAliasesExisting: jest.fn(),
  dbFindUserByEmail: jest.fn(),
  dbFindUserById: jest.fn(),
  dbFindUserWithContactById: jest.fn(),
  dbHasGuestRegisteredByLink: jest.fn(),
  dbHomeCommunityGetUuid: jest.fn(),
  dbInsertEvent: jest.fn(),
  dbInsertUser: jest.fn(),
  dbInsertUserAlias: jest.fn(),
  dbInsertUserContact: jest.fn(),
  dbIsUserContactFieldExist: jest.fn(),
  dbLocalUserGradidoIdExist: jest.fn(),
  dbLockUserRowDrizzle: jest.fn(),
  dbReleaseUnconfirmedEmailChangeFor: jest.fn(),
  dbRemoveUser: jest.fn(),
  dbRemoveUserAlias: jest.fn(),
  dbRemoveUserContact: jest.fn(),
  dbUserUpdateField: jest.fn(),
  dbUserUpdatePassword: jest.fn(),
  drizzleDb: jest.fn(),
  getHomeCommunityDrizzle: jest.fn(),
}))
jest.mock('core', () => ({
  ...jest.requireActual('core'),
  registerAddressTransaction: jest.fn(),
  sendAccountActivationEmail: jest.fn(),
  sendAccountMultiRegistrationEmail: jest.fn(),
  sendAssistedRegistrationConfirmEmail: jest.fn(),
}))
jest.mock('@/graphql/resolver/util/syncHumhub', () => ({ syncHumhub: jest.fn() }))
jest.mock('@/password/PasswordEncryptor', () => ({ encryptPassword: jest.fn() }))
jest.mock('@/data/GuarantorCode.logic', () => ({
  ...jest.requireActual('@/data/GuarantorCode.logic'),
  verifyGuarantorCode: jest.fn(),
}))

import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import {
  registerAddressTransaction,
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
  sendAssistedRegistrationConfirmEmail,
} from 'core'
import {
  AccountState,
  ALIAS_ORIGIN_ASSIGNED,
  ALIAS_ORIGIN_CHOSEN,
  CommunitiesSelect,
  DBDuplicateEntryError,
  DbUser,
  dbCountUnconfirmedVouchedAccounts,
  dbFindContributionLinkIdByCode,
  dbFindLocalUserByAlias,
  dbFindProjectBrandingByAlias,
  dbFindTransactionLinkByCode,
  dbFindTransactionLinkWithOwner,
  dbFindUserAliasesExisting,
  dbFindUserByEmail,
  dbFindUserById,
  dbFindUserWithContactById,
  dbHasGuestRegisteredByLink,
  dbHomeCommunityGetUuid,
  dbInsertEvent,
  dbInsertUser,
  dbInsertUserAlias,
  dbInsertUserContact,
  dbIsUserContactFieldExist,
  dbLockUserRowDrizzle,
  dbReleaseUnconfirmedEmailChangeFor,
  dbRemoveUser,
  dbRemoveUserAlias,
  dbRemoveUserContact,
  dbUserUpdateField,
  dbUserUpdatePassword,
  drizzleDb,
  EventType,
  getHomeCommunityDrizzle,
  ProjectBrandingSelect,
  TransactionLinksSelect,
  TransactionLinkWithOwner,
  UserContactInsert,
  UserSelect,
} from 'database'
import { getLogger } from 'log4js'
import * as v from 'valibot'
import { CONFIG } from '@/config'
import { GUARANTOR_LIMIT, verifyGuarantorCode } from '@/data/GuarantorCode.logic'
import { syncHumhub } from '@/graphql/resolver/util/syncHumhub'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { CreateUser, createUserSchema } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'
import { RegisterUserForProjectRole } from './RegisterUserForProject.role'
import { RegisterUserFromTransactionLinkRole } from './RegisterUserFromTransactionLink.role'
import { RegisterUserFromVouchingLinkRole } from './RegisterUserFromVouchingLink.role'
import { RegisterUserGuarantorRole } from './RegisterUserGuarantor.role'
import { RegisterUserReferrerRole } from './RegisterUserReferrer.role'

const logger = getLogger('test.registerUser.role')

// Jest 27's types have no `jest.mocked`; this is the same, typed after the mocked function.
const mocked = <T extends (...args: never[]) => unknown>(fn: T) => fn as jest.MockedFunction<T>

const COMMUNITY_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const USER_ID = 17
const CONTACT_ID = 23
const ALIAS_ID = 31
const REFERRER_ID = 5

const input = (extra: Record<string, unknown> = {}): CreateUser =>
  v.parse(createUserSchema, {
    email: 'bernd@example.com',
    firstName: 'Bernd',
    lastName: 'Hückstädt',
    language: 'de',
    ...extra,
  })

const storedUser = { id: USER_ID, gradidoId: 'stored-gradido-id' } as DbUser
const duplicateAlias = (alias: string) => ({
  success: false as const,
  error: new DBDuplicateEntryError('user_aliases', 'alias', alias),
})

// The verification code the role wrote into the contact - the activation link has to carry it.
const storedVerificationCode = (): string =>
  String((mocked(dbInsertUserContact).mock.calls[0][0] as UserContactInsert).emailVerificationCode)

const insertedEvents = () => mocked(dbInsertEvent).mock.calls.map(([event]) => event)

// The transaction run() opens: it hands its callback this stand-in and answers with what the
// callback answers - and when the callback throws, so does the transaction, which is where the
// database would roll back.
const tx = { execute: jest.fn() }

// A database on which every write succeeds and nobody else holds a name.
beforeEach(() => {
  jest.clearAllMocks()
  mocked(drizzleDb).mockReturnValue({
    transaction: (callback: (t: typeof tx) => Promise<unknown>) => callback(tx),
  } as unknown as ReturnType<typeof drizzleDb>)
  CONFIG.DLT_ACTIVE = false
  mocked(dbHomeCommunityGetUuid).mockResolvedValue(COMMUNITY_UUID)
  mocked(dbInsertUser).mockResolvedValue({ success: true, value: USER_ID })
  mocked(dbInsertUserContact).mockResolvedValue({ success: true, value: CONTACT_ID })
  mocked(dbUserUpdateField).mockResolvedValue(1)
  mocked(dbInsertUserAlias).mockResolvedValue({ success: true, value: ALIAS_ID })
  mocked(dbFindUserAliasesExisting).mockResolvedValue([])
  mocked(dbFindUserWithContactById).mockResolvedValue(storedUser)
  mocked(sendAccountActivationEmail).mockResolvedValue({})
  mocked(sendAssistedRegistrationConfirmEmail).mockResolvedValue({})
  // run() does not wait for these any more, it hangs a .catch on each: a bare jest.fn()
  // answers undefined, which has none.
  mocked(dbInsertEvent).mockResolvedValue(undefined)
  mocked(registerAddressTransaction).mockResolvedValue(null)
  mocked(syncHumhub).mockResolvedValue(undefined)
})

// What run() started without waiting for - the mail and its event, the registration event, DLT,
// HumHub - has settled once the queue of pending callbacks is empty.
const settled = () => new Promise((resolve) => setImmediate(resolve))

describe('RegisterUserRole', () => {
  it('stores user and contact, links them and returns the new id', async () => {
    expect(await new RegisterUserRole(input()).run(logger)).toBe(USER_ID)

    expect(dbInsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Bernd',
        lastName: 'Hückstädt',
        language: 'de',
        communityUuid: COMMUNITY_UUID,
        passwordEncryptionType: PasswordEncryptionType.NO_PASSWORD,
        humhubAllowed: true,
      }),
      tx,
    )
    expect(dbInsertUserContact).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'bernd@example.com', userId: USER_ID, emailChecked: false }),
      tx,
    )
    expect(dbUserUpdateField).toHaveBeenCalledWith(USER_ID, 'emailId', CONTACT_ID, tx)
  })

  it('sends the activation link carrying the stored verification code', async () => {
    await new RegisterUserRole(input()).run(logger)
    expect(sendAccountActivationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'bernd@example.com',
        activationLink: `${CONFIG.EMAIL_LINK_VERIFICATION}${storedVerificationCode()}`,
      }),
    )
  })

  // The mail event waits for the mail, the registration event for nothing: their order is open.
  it('records the mail and the registration', async () => {
    await new RegisterUserRole(input()).run(logger)
    await settled()
    expect(insertedEvents()).toHaveLength(2)
    expect(insertedEvents()).toEqual(
      expect.arrayContaining([
        { type: EventType.EMAIL_CONFIRMATION, affectedUserId: USER_ID, actingUserId: USER_ID },
        { type: EventType.USER_REGISTER, affectedUserId: USER_ID, actingUserId: USER_ID },
      ]),
    )
  })

  /**
   * Once user, contact and alias are stored, the account stands: what follows - the mail, the
   * events, DLT, HumHub - is logged when it fails, and neither undoes the account nor reaches
   * the client. The guest could do nothing with a failed mail but register again, which then
   * finds the address taken.
   */
  describe('after the account is stored', () => {
    let logError: jest.SpyInstance

    beforeEach(() => {
      logError = jest.spyOn(logger, 'error').mockImplementation(() => undefined)
    })

    afterEach(() => {
      logError.mockRestore()
    })

    it('keeps the account when the mail fails, and records no mail', async () => {
      mocked(sendAccountActivationEmail).mockResolvedValue(new Error('smtp down'))

      expect(await new RegisterUserRole(input()).run(logger)).toBe(USER_ID)
      await settled()

      expect(dbRemoveUser).not.toHaveBeenCalled()
      expect(insertedEvents()).toEqual([
        { type: EventType.USER_REGISTER, affectedUserId: USER_ID, actingUserId: USER_ID },
      ])
      expect(logError).toHaveBeenCalledWith(
        'error sending account activation email: Error: smtp down',
      )
    })

    it('keeps the account when an event, DLT or HumHub fails', async () => {
      CONFIG.DLT_ACTIVE = true
      mocked(getHomeCommunityDrizzle).mockResolvedValue({} as never)
      mocked(dbInsertEvent).mockRejectedValue(new Error('events down'))
      mocked(registerAddressTransaction).mockRejectedValue(new Error('dlt down'))
      mocked(syncHumhub).mockRejectedValue(new Error('humhub down'))

      expect(await new RegisterUserRole(input()).run(logger)).toBe(USER_ID)
      await settled()

      expect(dbRemoveUser).not.toHaveBeenCalled()
      expect(logError).toHaveBeenCalledWith('error on write register event: Error: events down')
      expect(logError).toHaveBeenCalledWith(
        'error on writing EMAIL_CONFIRMATION event: Error: events down',
      )
      expect(logError).toHaveBeenCalledWith('error on register address in dlt: Error: dlt down')
      // syncHumhub catches on its own, before run() would have to.
      expect(logError).toHaveBeenCalledWith(
        "registerUser: couldn't reach out to humhub, disable for now",
        new Error('humhub down'),
      )
    })
  })

  describe('alias', () => {
    it('assigns first name plus one letter when that is free', async () => {
      await new RegisterUserRole(input()).run(logger)
      expect(dbInsertUserAlias).toHaveBeenCalledWith(
        {
          alias: 'BerndH',
          userId: USER_ID,
          origin: ALIAS_ORIGIN_ASSIGNED,
        },
        tx,
      )
      expect(dbFindUserAliasesExisting).not.toHaveBeenCalled()
      expect(dbUserUpdateField).toHaveBeenCalledWith(USER_ID, 'alias', 'BerndH', tx)
    })

    it('walks on to the next name when that is taken, in its own spelling', async () => {
      mocked(dbInsertUserAlias).mockResolvedValueOnce(duplicateAlias('BerndH'))
      mocked(dbFindUserAliasesExisting).mockResolvedValue(['berndh'])

      await new RegisterUserRole(input()).run(logger)

      expect(dbInsertUserAlias).toHaveBeenLastCalledWith(
        {
          alias: 'BerndHue',
          userId: USER_ID,
          origin: ALIAS_ORIGIN_ASSIGNED,
        },
        tx,
      )
      expect(dbUserUpdateField).toHaveBeenCalledWith(USER_ID, 'alias', 'BerndHue', tx)
    })

    it('keeps the alias the member chose', async () => {
      await new RegisterUserRole(input({ alias: 'bernd-the-gardener' })).run(logger)
      expect(dbInsertUserAlias).toHaveBeenCalledWith(
        {
          alias: 'bernd-the-gardener',
          userId: USER_ID,
          origin: ALIAS_ORIGIN_CHOSEN,
        },
        tx,
      )
    })

    // A name the system builds is a proposal and costs none of the member's four picks.
    it('hands out a proposal, not a pick, when the chosen alias is taken', async () => {
      mocked(dbInsertUserAlias).mockResolvedValueOnce(duplicateAlias('bernd-the-gardener'))

      await new RegisterUserRole(input({ alias: 'bernd-the-gardener' })).run(logger)

      expect(dbInsertUserAlias).toHaveBeenLastCalledWith(
        {
          alias: 'BerndH',
          userId: USER_ID,
          origin: ALIAS_ORIGIN_ASSIGNED,
        },
        tx,
      )
    })
  })

  // User, contact and alias are written in one transaction: a failure half way leaves the
  // transaction by throwing, and the database takes back what was written. Nothing deletes by
  // hand any more, and nothing after the transaction runs.
  it('fails the transaction and sends nothing when storing fails half way', async () => {
    mocked(dbUserUpdateField).mockImplementation(async (_id, field) => (field === 'alias' ? 0 : 1))

    await expect(new RegisterUserRole(input()).run(logger)).rejects.toThrow(
      'Error while storing the generated alias',
    )
    expect(dbRemoveUser).not.toHaveBeenCalled()
    expect(dbRemoveUserContact).not.toHaveBeenCalled()
    expect(dbRemoveUserAlias).not.toHaveBeenCalled()
    expect(sendAccountActivationEmail).not.toHaveBeenCalled()
    expect(dbInsertEvent).not.toHaveBeenCalled()
  })

  it('registers the address on the blockchain when DLT is active', async () => {
    const homeCom = { communityUuid: COMMUNITY_UUID } as CommunitiesSelect
    mocked(getHomeCommunityDrizzle).mockResolvedValue(homeCom)
    CONFIG.DLT_ACTIVE = true

    await new RegisterUserRole(input()).run(logger)

    expect(registerAddressTransaction).toHaveBeenCalledWith(storedUser, homeCom)
  })
})

// Somebody's change typed the address in and never confirmed it: the contact insert collides,
// nobody holds the address as their account's, and the pending change yields to the registration.
describe('RegisterUserRole with an address a pending change holds', () => {
  beforeEach(() => {
    mocked(dbInsertUserContact).mockResolvedValueOnce({
      success: false,
      error: new DBDuplicateEntryError('user_contacts', 'email', 'bernd@example.com'),
    })
    mocked(dbFindUserByEmail).mockResolvedValue(null)
    mocked(dbReleaseUnconfirmedEmailChangeFor).mockResolvedValue(1)
  })

  it('releases the pending change and opens the account', async () => {
    expect(await new RegisterUserRole(input()).run(logger)).toBe(USER_ID)

    expect(dbReleaseUnconfirmedEmailChangeFor).toHaveBeenCalledWith('bernd@example.com', tx)
    expect(dbInsertUserContact).toHaveBeenCalledTimes(2)
    expect(sendAccountActivationEmail).toHaveBeenCalled()
    expect(sendAccountMultiRegistrationEmail).not.toHaveBeenCalled()
  })

  it('refuses when neither a change nor a verification code explains the collision', async () => {
    mocked(dbReleaseUnconfirmedEmailChangeFor).mockResolvedValue(0)
    mocked(dbIsUserContactFieldExist).mockResolvedValue(0)

    await expect(new RegisterUserRole(input()).run(logger)).rejects.toThrow(
      'Error while saving user email contact',
    )
  })
})

// The address is taken: the contact insert collides, and the registration answers as if it
// had opened an account - the answer must not tell a taken address from a free one.
describe('RegisterUserRole with an address that is taken', () => {
  const owner = { id: 3, firstName: 'Peter', lastName: 'Lustig', language: 'en' } as UserSelect

  beforeEach(() => {
    mocked(dbInsertUserContact).mockResolvedValue({
      success: false,
      error: new DBDuplicateEntryError('user_contacts', 'email', 'bernd@example.com'),
    })
    mocked(dbFindUserByEmail).mockResolvedValue(owner)
  })

  it('answers with an id like a new account, and opens nothing', async () => {
    const answer = await new RegisterUserRole(input()).run(logger)

    // Never 0: the resolver answers `id !== 0`, so a 0 would give the taken address away.
    expect(answer).toBeGreaterThan(0)
    expect(dbInsertUserAlias).not.toHaveBeenCalled()
    expect(sendAccountActivationEmail).not.toHaveBeenCalled()
    expect(insertedEvents()).toEqual([
      { type: EventType.EMAIL_ACCOUNT_MULTIREGISTRATION, affectedUserId: 3, actingUserId: 0 },
    ])
  })

  // The owner reads their own name - never the one the stranger typed into the form.
  it('tells the owner of the address, in their name and language', async () => {
    await new RegisterUserRole(input()).run(logger)

    expect(sendAccountMultiRegistrationEmail).toHaveBeenCalledWith({
      firstName: 'Peter',
      lastName: 'Lustig',
      email: 'bernd@example.com',
      language: 'en',
    })
  })

  // The users row is written before the contact collides; it must not stay behind.
  it('leaves no account row behind', async () => {
    await new RegisterUserRole(input()).run(logger)

    expect(dbRemoveUser).toHaveBeenCalledWith(USER_ID, tx)
  })

  // The tests of the resolver waited for exactly this line.
  it('logs that the address is taken, under the owner and without the address', async () => {
    const infoSpy = jest.spyOn(logger, 'info')
    const addContextSpy = jest.spyOn(logger, 'addContext')
    const removeContextSpy = jest.spyOn(logger, 'removeContext')

    await new RegisterUserRole(input()).run(logger)

    expect(infoSpy).toHaveBeenCalledWith('User already exists')
    expect(addContextSpy).toHaveBeenCalledWith('user', 3)
    expect(removeContextSpy).toHaveBeenCalledWith('email')
  })
})

describe('RegisterUserReferrerRole', () => {
  it('records the owner of the address as referrer', async () => {
    mocked(dbFindLocalUserByAlias).mockResolvedValue({ id: REFERRER_ID } as UserSelect)

    await new RegisterUserReferrerRole(input({ referrerAlias: 'PeterL' })).run(logger)

    expect(dbInsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ referrerId: REFERRER_ID }),
      tx,
    )
    expect(insertedEvents()).toContainEqual({
      type: EventType.USER_REGISTER,
      affectedUserId: USER_ID,
      actingUserId: REFERRER_ID,
    })
  })

  // An alias nobody holds changes nothing - no error, and the same answer: the registration
  // must not tell whether a well-formed name belongs to somebody.
  it('registers as usual when nobody holds the address', async () => {
    mocked(dbFindLocalUserByAlias).mockResolvedValue(null)

    expect(await new RegisterUserReferrerRole(input({ referrerAlias: 'Nobody' })).run(logger)).toBe(
      USER_ID,
    )
    expect(insertedEvents()).toContainEqual({
      type: EventType.USER_REGISTER,
      affectedUserId: USER_ID,
      actingUserId: USER_ID,
    })
  })
})

describe('RegisterUserFromTransactionLinkRole', () => {
  it('attaches a contribution link and records it', async () => {
    mocked(dbFindContributionLinkIdByCode).mockResolvedValue(9)

    await new RegisterUserFromTransactionLinkRole(input({ redeemCode: 'CL-abc' })).run(logger)

    expect(dbInsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ contributionLinkId: 9 }),
      tx,
    )
    expect(sendAccountActivationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        activationLink: `${CONFIG.EMAIL_LINK_VERIFICATION}${storedVerificationCode()}/CL-abc`,
      }),
    )
    expect(insertedEvents()).toContainEqual({
      type: EventType.USER_REGISTER_REDEEM,
      affectedUserId: USER_ID,
      actingUserId: USER_ID,
      involvedContributionLinkId: 9,
    })
  })

  it('makes the creator of a transaction link the referrer', async () => {
    mocked(dbFindTransactionLinkByCode).mockResolvedValue({
      id: 11,
      userId: REFERRER_ID,
    } as TransactionLinksSelect)

    await new RegisterUserFromTransactionLinkRole(input({ redeemCode: 'abc123' })).run(logger)

    expect(dbInsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ referrerId: REFERRER_ID }),
      tx,
    )
    expect(insertedEvents()).toContainEqual({
      type: EventType.USER_REGISTER_REDEEM,
      affectedUserId: USER_ID,
      actingUserId: USER_ID,
      involvedTransactionLinkId: 11,
    })
  })
})

describe('RegisterUserForProjectRole', () => {
  it('brands the mail and joins the project space', async () => {
    mocked(dbFindProjectBrandingByAlias).mockResolvedValue({
      logoUrl: 'https://logo',
      spaceId: 42,
    } as ProjectBrandingSelect)

    await new RegisterUserForProjectRole(input({ project: 'garden' })).run(logger)

    expect(sendAccountActivationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        activationLink: `${CONFIG.EMAIL_LINK_VERIFICATION}${storedVerificationCode()}?project=garden`,
        logoUrl: 'https://logo',
      }),
    )
    expect(syncHumhub).toHaveBeenCalledWith(null, storedUser, storedUser.gradidoId, 42)
  })
})

describe('RegisterUserGuarantorRole', () => {
  const guarantorInput = () =>
    input({
      guarantorCode: '1700000000.AbCdEfGhIjKlMnOpQrStUv',
      password: 'Aa1!aaaa',
      referrerAlias: 'PeterL',
    })

  beforeEach(() => {
    mocked(verifyGuarantorCode).mockReturnValue(REFERRER_ID)
    mocked(dbFindUserById).mockResolvedValue({ id: REFERRER_ID } as UserSelect)
    mocked(dbCountUnconfirmedVouchedAccounts).mockResolvedValue(0)
    mocked(encryptPassword).mockResolvedValue(123n)
  })

  it('opens the account with the password, in the member’s name', async () => {
    expect(await new RegisterUserGuarantorRole(guarantorInput()).run(logger)).toBe(USER_ID)

    expect(dbInsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        referrerId: REFERRER_ID,
        accountState: AccountState.PARTLY_ACTIVATED_GUARANTOR,
        // The type follows with the hash in afterRun: without the hash the row holds no password.
        passwordEncryptionType: PasswordEncryptionType.NO_PASSWORD,
      }),
      tx,
    )
    expect(dbUserUpdatePassword).toHaveBeenCalledWith(
      USER_ID,
      PasswordEncryptionType.GRADIDO_ID,
      123n,
    )
    expect(insertedEvents()).toContainEqual({
      type: EventType.USER_REGISTER_GUARANTOR,
      affectedUserId: USER_ID,
      actingUserId: REFERRER_ID,
    })
  })

  // The code names the member; the address the guest came from is not asked.
  it('takes the member from the code, not from the address', async () => {
    await new RegisterUserGuarantorRole(
      input({ guarantorCode: '1700000000.AbCdEfGhIjKlMnOpQrStUv', password: 'Aa1!aaaa' }),
    ).run(logger)

    expect(verifyGuarantorCode).toHaveBeenCalledWith(
      '1700000000.AbCdEfGhIjKlMnOpQrStUv',
      COMMUNITY_UUID,
      expect.any(Date),
    )
    expect(dbFindUserById).toHaveBeenCalledWith(REFERRER_ID)
    expect(dbFindLocalUserByAlias).not.toHaveBeenCalled()
    expect(dbInsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ referrerId: REFERRER_ID }),
      tx,
    )
  })

  // The password exists already, so the set-password page would be the wrong door (EM-013).
  it('asks only to confirm the address', async () => {
    await new RegisterUserGuarantorRole(guarantorInput()).run(logger)

    expect(sendAssistedRegistrationConfirmEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmLink: `${CONFIG.EMAIL_LINK_CONFIRM_EMAIL}${storedVerificationCode()}`,
      }),
    )
    expect(sendAccountActivationEmail).not.toHaveBeenCalled()
  })

  it('refuses an invalid code before anything is stored', async () => {
    mocked(verifyGuarantorCode).mockReturnValue(null)

    await expect(new RegisterUserGuarantorRole(guarantorInput()).run(logger)).rejects.toThrow(
      'Guarantor code invalid or expired',
    )
    expect(dbInsertUser).not.toHaveBeenCalled()
  })

  it('refuses when the member vouches for too many unconfirmed accounts', async () => {
    mocked(dbCountUnconfirmedVouchedAccounts).mockResolvedValue(GUARANTOR_LIMIT)

    await expect(new RegisterUserGuarantorRole(guarantorInput()).run(logger)).rejects.toThrow(
      'Vouching limit reached',
    )
    expect(dbInsertUser).not.toHaveBeenCalled()
  })

  it('refuses when the member behind the code is gone', async () => {
    mocked(dbFindUserById).mockResolvedValue(null)

    await expect(new RegisterUserGuarantorRole(guarantorInput()).run(logger)).rejects.toThrow(
      'Guarantor code invalid or expired',
    )
    expect(dbInsertUser).not.toHaveBeenCalled()
  })
})

/**
 * A redeem code that comes with a password (ZE-017 F5). The link vouches for the account as a
 * guarantor code does - while four things hold. Where one of them does not, the registration is
 * the one of RegisterUserFromTransactionLinkRole, and answers the same: nothing is refused.
 */
describe('RegisterUserFromVouchingLinkRole', () => {
  const LINK_ID = 11
  const PASSWORD = 'Aa1!aaaa'
  const HOUR_MS = 60 * 60 * 1000

  const linkInput = (extra: Record<string, unknown> = {}) =>
    input({ redeemCode: 'abc123', password: PASSWORD, ...extra })

  // An open link of a confirmed member: the link the four rules are measured against.
  const openLink = (changed: Partial<TransactionLinkWithOwner> = {}): TransactionLinkWithOwner => ({
    userId: REFERRER_ID,
    validUntil: new Date(Date.now() + HOUR_MS),
    redeemedAt: null,
    redeemedBy: null,
    deletedAt: null,
    ownerDeletedAt: null,
    ownerForeign: false,
    ownerEmailChecked: true,
    ...changed,
  })

  const linkEvent = {
    type: EventType.USER_REGISTER_REDEEM,
    affectedUserId: USER_ID,
    actingUserId: USER_ID,
    involvedTransactionLinkId: LINK_ID,
  }

  // The order in which the mocks were called, by the first call of each.
  const firstCall = (fn: (...args: never[]) => unknown): number =>
    mocked(fn).mock.invocationCallOrder[0]

  // Everything holds: the link is open, its maker confirmed, a place free, the link unused.
  beforeEach(() => {
    mocked(dbFindTransactionLinkByCode).mockResolvedValue({
      id: LINK_ID,
      userId: REFERRER_ID,
    } as TransactionLinksSelect)
    mocked(dbFindContributionLinkIdByCode).mockResolvedValue(null)
    mocked(dbFindTransactionLinkWithOwner).mockResolvedValue(openLink())
    mocked(dbCountUnconfirmedVouchedAccounts).mockResolvedValue(0)
    mocked(dbHasGuestRegisteredByLink).mockResolvedValue(false)
    mocked(encryptPassword).mockResolvedValue(123n)
  })

  describe('with an open link of a confirmed member, a free place and no account through it yet', () => {
    it('opens the account as a guarantor code does: the state, the referrer, the password', async () => {
      expect(await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger)).toBe(USER_ID)

      expect(dbInsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          referrerId: REFERRER_ID,
          accountState: AccountState.PARTLY_ACTIVATED_GUARANTOR,
          // The type follows with the hash in afterRun: without the hash the row holds no password.
          passwordEncryptionType: PasswordEncryptionType.NO_PASSWORD,
        }),
        tx,
      )
      expect(encryptPassword).toHaveBeenCalledWith(expect.anything(), PASSWORD)
      expect(dbUserUpdatePassword).toHaveBeenCalledWith(
        USER_ID,
        PasswordEncryptionType.GRADIDO_ID,
        123n,
      )
    })

    // The password exists already, so the set-password link would be the wrong door - and the
    // mail says where the account came from, without the name of who thanked.
    it('asks only to confirm the address, and says the account came of a thank-you', async () => {
      await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger)

      expect(sendAssistedRegistrationConfirmEmail).toHaveBeenCalledWith({
        firstName: 'Bernd',
        lastName: 'Hückstädt',
        email: 'bernd@example.com',
        language: 'de',
        confirmLink: `${CONFIG.EMAIL_LINK_CONFIRM_EMAIL}${storedVerificationCode()}`,
        timeDurationObject: expect.anything(),
        byThanks: true,
      })
      expect(sendAccountActivationEmail).not.toHaveBeenCalled()
    })

    // The event stays the one of a link: the mail to the member who thanked reads it ("and is
    // new here"). Written once, in the transaction - it is the trace the next registration
    // through this link looks for.
    it('records the registration as one through the link, once, with the account', async () => {
      await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger)
      await settled()

      expect(dbInsertEvent).toHaveBeenCalledWith(linkEvent, tx)
      expect(
        insertedEvents().filter((event) => event.type === EventType.USER_REGISTER_REDEEM),
      ).toEqual([linkEvent])
      expect(firstCall(dbInsertEvent)).toBeGreaterThan(firstCall(dbInsertUser))
    })

    // Under REPEATABLE READ the first plain read fixes what the transaction sees. The lock has
    // to come before all of them, or a request that waited for it counts an old state.
    it('takes the lock of the member’s row before anything is read or written', async () => {
      await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger)

      expect(dbLockUserRowDrizzle).toHaveBeenCalledWith(REFERRER_ID, tx)
      for (const later of [
        dbCountUnconfirmedVouchedAccounts,
        dbFindTransactionLinkWithOwner,
        dbHasGuestRegisteredByLink,
        dbInsertUser,
      ]) {
        expect(firstCall(dbLockUserRowDrizzle)).toBeLessThan(firstCall(later))
      }
      expect(tx.execute).not.toHaveBeenCalled()
    })

    // Every one of them through the transaction: a read over another connection would not
    // see what the request before it stored, and would take a second connection from the pool.
    it('reads everything that decides through the transaction', async () => {
      await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger)

      expect(dbCountUnconfirmedVouchedAccounts).toHaveBeenCalledWith(REFERRER_ID, tx)
      expect(dbFindTransactionLinkWithOwner).toHaveBeenCalledWith(LINK_ID, tx)
      expect(dbHasGuestRegisteredByLink).toHaveBeenCalledWith(REFERRER_ID, LINK_ID, tx)
    })

    it('takes the last place under the limit', async () => {
      mocked(dbCountUnconfirmedVouchedAccounts).mockResolvedValue(GUARANTOR_LIMIT - 1)

      await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger)

      expect(dbUserUpdatePassword).toHaveBeenCalled()
    })

    // The hash runs beside the rest, and starts for an account that stands: the address was
    // free. Started before the account is stored, it ran for a taken address as well.
    it('starts to encrypt the password once the account is stored, for the id it has', async () => {
      // The account as it is read back: under the id it was stored with.
      mocked(dbFindUserWithContactById).mockImplementation(
        async () =>
          ({ id: USER_ID, gradidoId: mocked(dbInsertUser).mock.calls[0][0].gradidoId }) as DbUser,
      )

      await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger)

      const [storedAs] = mocked(dbInsertUser).mock.calls[0]
      expect(encryptPassword).toHaveBeenCalledTimes(1)
      expect(encryptPassword).toHaveBeenCalledWith(
        expect.objectContaining({ gradidoId: storedAs.gradidoId }),
        PASSWORD,
      )
      expect(mocked(encryptPassword).mock.invocationCallOrder[0]).toBeGreaterThan(
        mocked(dbInsertUserContact).mock.invocationCallOrder[0],
      )
    })

    // The account read back carries another gradido id than the one the hash was started for:
    // the password is encrypted for the id the account has.
    it('encrypts the password again when the account got another gradido id', async () => {
      mocked(dbInsertUser).mockResolvedValueOnce({
        success: false,
        error: new DBDuplicateEntryError('users', 'gradido_id,community_uuid', 'taken'),
      })
      mocked(dbFindUserWithContactById).mockResolvedValue({
        id: USER_ID,
        gradidoId: 'the-second-gradido-id',
      } as DbUser)
      mocked(encryptPassword).mockResolvedValueOnce(1n).mockResolvedValueOnce(2n)

      await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger)

      expect(encryptPassword).toHaveBeenLastCalledWith(
        expect.objectContaining({ gradidoId: 'the-second-gradido-id' }),
        PASSWORD,
      )
      expect(dbUserUpdatePassword).toHaveBeenCalledWith(
        USER_ID,
        PasswordEncryptionType.GRADIDO_ID,
        2n,
      )
    })
  })

  /**
   * One rule broken at a time. Each time: the way of RegisterUserFromTransactionLinkRole - no
   * state, no password, the activation mail with the code, the event after the transaction -
   * and the same answer, without an error.
   */
  describe('where the link does not vouch', () => {
    const expectTheWayThroughTheMail = async (answer: number) => {
      await settled()
      expect(answer).toBe(USER_ID)
      expect(dbInsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          referrerId: REFERRER_ID,
          passwordEncryptionType: PasswordEncryptionType.NO_PASSWORD,
        }),
        tx,
      )
      expect(mocked(dbInsertUser).mock.calls[0][0]).not.toHaveProperty('accountState')
      expect(encryptPassword).not.toHaveBeenCalled()
      expect(dbUserUpdatePassword).not.toHaveBeenCalled()
      expect(sendAssistedRegistrationConfirmEmail).not.toHaveBeenCalled()
      expect(sendAccountActivationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          activationLink: `${CONFIG.EMAIL_LINK_VERIFICATION}${storedVerificationCode()}/abc123`,
        }),
      )
      // As before: after the transaction, over the pool - and once.
      expect(dbInsertEvent).toHaveBeenCalledWith(linkEvent, undefined)
      expect(
        insertedEvents().filter((event) => event.type === EventType.USER_REGISTER_REDEEM),
      ).toEqual([linkEvent])
    }

    it.each<[string, Partial<TransactionLinkWithOwner>]>([
      ['the thank-you was accepted already', { redeemedAt: new Date(), redeemedBy: 9 }],
      ['the link has run out', { validUntil: new Date(Date.now() - HOUR_MS) }],
      ['the link was deleted in the meantime', { deletedAt: new Date() }],
      ['the member who made it has not confirmed their address', { ownerEmailChecked: false }],
      ['the member who made it is deleted', { ownerDeletedAt: new Date() }],
    ])('goes the way through the mail when %s', async (_what, changed) => {
      mocked(dbFindTransactionLinkWithOwner).mockResolvedValue(openLink(changed))

      await expectTheWayThroughTheMail(
        await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger),
      )
    })

    it('goes the way through the mail when nobody stands behind the link', async () => {
      mocked(dbFindTransactionLinkWithOwner).mockResolvedValue(null)

      await expectTheWayThroughTheMail(
        await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger),
      )
    })

    // The eleventh guest. A guarantor code refuses here, with the member beside the guest; a
    // link has nobody beside it.
    it('goes the way through the mail at the member’s limit, and refuses nothing', async () => {
      mocked(dbCountUnconfirmedVouchedAccounts).mockResolvedValue(GUARANTOR_LIMIT)

      await expectTheWayThroughTheMail(
        await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger),
      )
    })

    // One link, one account.
    it('goes the way through the mail when an account was registered through the link before', async () => {
      mocked(dbHasGuestRegisteredByLink).mockResolvedValue(true)

      await expectTheWayThroughTheMail(
        await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger),
      )
    })

    // The entrance hands this variant only what comes with a password. It does not rely on
    // that: without one nothing vouches - the account would stand there in the state of a
    // vouched one, with no way in - and nothing is asked.
    it('goes the way through the mail without a password, and asks nothing', async () => {
      await expectTheWayThroughTheMail(
        await new RegisterUserFromVouchingLinkRole(input({ redeemCode: 'abc123' })).run(logger),
      )
      expect(dbLockUserRowDrizzle).not.toHaveBeenCalled()
      expect(dbFindTransactionLinkWithOwner).not.toHaveBeenCalled()
    })
  })

  // No member's link, so nobody to vouch: not even the lock is taken.
  describe('with a redeem code that is no member’s link', () => {
    const expectNoGuarantorAsked = () => {
      expect(dbLockUserRowDrizzle).not.toHaveBeenCalled()
      expect(dbCountUnconfirmedVouchedAccounts).not.toHaveBeenCalled()
      expect(dbFindTransactionLinkWithOwner).not.toHaveBeenCalled()
      expect(encryptPassword).not.toHaveBeenCalled()
      expect(dbUserUpdatePassword).not.toHaveBeenCalled()
      expect(sendAssistedRegistrationConfirmEmail).not.toHaveBeenCalled()
    }

    it('gives no password with a contribution link', async () => {
      mocked(dbFindContributionLinkIdByCode).mockResolvedValue(9)

      await new RegisterUserFromVouchingLinkRole(linkInput({ redeemCode: 'CL-abc' })).run(logger)
      await settled()

      expectNoGuarantorAsked()
      expect(dbFindTransactionLinkByCode).not.toHaveBeenCalled()
      expect(dbInsertUser).toHaveBeenCalledWith(
        expect.objectContaining({ contributionLinkId: 9 }),
        tx,
      )
      expect(mocked(dbInsertUser).mock.calls[0][0]).not.toHaveProperty('accountState')
      expect(insertedEvents()).toContainEqual({
        type: EventType.USER_REGISTER_REDEEM,
        affectedUserId: USER_ID,
        actingUserId: USER_ID,
        involvedContributionLinkId: 9,
      })
    })

    it('gives no password with a code nobody knows', async () => {
      mocked(dbFindTransactionLinkByCode).mockResolvedValue(null)

      expect(await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger)).toBe(USER_ID)
      await settled()

      expectNoGuarantorAsked()
      expect(mocked(dbInsertUser).mock.calls[0][0]).not.toHaveProperty('referrerId')
      expect(sendAccountActivationEmail).toHaveBeenCalled()
      expect(insertedEvents()).toContainEqual({
        type: EventType.USER_REGISTER,
        affectedUserId: USER_ID,
        actingUserId: USER_ID,
      })
    })
  })

  // The address is taken: nothing is opened and the answer is the one of every registration,
  // whether the link would have vouched or not.
  describe('with an address that is taken', () => {
    const owner = { id: 3, firstName: 'Peter', lastName: 'Lustig', language: 'en' } as UserSelect

    beforeEach(() => {
      mocked(dbInsertUserContact).mockResolvedValue({
        success: false,
        error: new DBDuplicateEntryError('user_contacts', 'email', 'bernd@example.com'),
      })
      mocked(dbFindUserByEmail).mockResolvedValue(owner)
    })

    it('opens nothing, stores no password, and tells the owner of the address', async () => {
      const answer = await new RegisterUserFromVouchingLinkRole(linkInput()).run(logger)
      await settled()

      expect(answer).toBeGreaterThan(0)
      expect(dbRemoveUser).toHaveBeenCalledWith(USER_ID, tx)
      expect(dbUserUpdatePassword).not.toHaveBeenCalled()
      // Not even started: the link stays open, and so would the work, request after request.
      expect(encryptPassword).not.toHaveBeenCalled()
      expect(sendAssistedRegistrationConfirmEmail).not.toHaveBeenCalled()
      expect(sendAccountActivationEmail).not.toHaveBeenCalled()
      expect(sendAccountMultiRegistrationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Peter', email: 'bernd@example.com' }),
      )
      // No trace of a registration through the link: the link still vouches for one account.
      expect(insertedEvents()).toEqual([
        { type: EventType.EMAIL_ACCOUNT_MULTIREGISTRATION, affectedUserId: 3, actingUserId: 0 },
      ])
    })
  })
})
