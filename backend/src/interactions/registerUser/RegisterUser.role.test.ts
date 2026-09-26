// AI-GENERATED — not an architecture reference
jest.mock('database', () => ({
  ...jest.requireActual('database'),
  dbCountUnconfirmedVouchedAccounts: jest.fn(),
  dbFindContributionLinkIdByCode: jest.fn(),
  dbFindLocalUserByAlias: jest.fn(),
  dbFindProjectBrandingByAlias: jest.fn(),
  dbFindTransactionLinkByCode: jest.fn(),
  dbFindUserAliasesWithRegex: jest.fn(),
  dbFindUserWithContactById: jest.fn(),
  dbHomeCommunityGetUuid: jest.fn(),
  dbInsertEvent: jest.fn(),
  dbInsertUser: jest.fn(),
  dbInsertUserAlias: jest.fn(),
  dbInsertUserContact: jest.fn(),
  dbIsUserContactFieldExist: jest.fn(),
  dbLocalUserGradidoIdExist: jest.fn(),
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
jest.mock('@/data/PresenceCode.logic', () => ({
  ...jest.requireActual('@/data/PresenceCode.logic'),
  verifyPresenceCode: jest.fn(),
}))

import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import {
  registerAddressTransaction,
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
  sendAssistedRegistrationConfirmEmail,
} from 'core'
import {
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
  dbFindUserAliasesWithRegex,
  dbFindUserWithContactById,
  dbHomeCommunityGetUuid,
  dbInsertEvent,
  dbInsertUser,
  dbInsertUserAlias,
  dbInsertUserContact,
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
  UserContactInsert,
  UserSelect,
} from 'database'
import { getLogger } from 'log4js'
import { CONFIG } from '@/config'
import { PRESENCE_MAX_UNCONFIRMED, verifyPresenceCode } from '@/data/PresenceCode.logic'
import { syncHumhub } from '@/graphql/resolver/util/syncHumhub'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { CreateUser, createUserSchema } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'
import { RegisterUserCardRole } from './RegisterUserCard.role'
import { RegisterUserExistRole } from './RegisterUserExist.role'
import { RegisterUserForProjectRole } from './RegisterUserForProject.role'
import { RegisterUserFromTransactionLinkRole } from './RegisterUserFromTransactionLink.role'
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
  createUserSchema.parse({
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

// A database on which every write succeeds and nobody else holds a name.
beforeEach(() => {
  jest.clearAllMocks()
  CONFIG.DLT_ACTIVE = false
  mocked(dbHomeCommunityGetUuid).mockResolvedValue(COMMUNITY_UUID)
  mocked(dbInsertUser).mockResolvedValue({ success: true, value: USER_ID })
  mocked(dbInsertUserContact).mockResolvedValue({ success: true, value: CONTACT_ID })
  mocked(dbUserUpdateField).mockResolvedValue(1)
  mocked(dbInsertUserAlias).mockResolvedValue({ success: true, value: ALIAS_ID })
  mocked(dbFindUserAliasesWithRegex).mockResolvedValue([])
  mocked(dbFindUserWithContactById).mockResolvedValue(storedUser)
  mocked(sendAccountActivationEmail).mockResolvedValue({})
  mocked(sendAssistedRegistrationConfirmEmail).mockResolvedValue({})
})

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
      undefined,
    )
    expect(dbInsertUserContact).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'bernd@example.com', userId: USER_ID, emailChecked: false }),
      undefined,
    )
    expect(dbUserUpdateField).toHaveBeenCalledWith(USER_ID, 'emailId', CONTACT_ID, undefined)
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

  it('records the mail and the registration', async () => {
    await new RegisterUserRole(input()).run(logger)
    expect(insertedEvents()).toEqual([
      { type: EventType.EMAIL_CONFIRMATION, affectedUserId: USER_ID, actingUserId: USER_ID },
      { type: EventType.USER_REGISTER, affectedUserId: USER_ID, actingUserId: USER_ID },
    ])
  })

  describe('alias', () => {
    it('assigns first name plus one letter when that is free', async () => {
      await new RegisterUserRole(input()).run(logger)
      expect(dbInsertUserAlias).toHaveBeenCalledWith({
        alias: 'BerndH',
        userId: USER_ID,
        origin: ALIAS_ORIGIN_ASSIGNED,
      })
      expect(dbFindUserAliasesWithRegex).not.toHaveBeenCalled()
      expect(dbUserUpdateField).toHaveBeenCalledWith(USER_ID, 'alias', 'BerndH')
    })

    it('walks on to the next name when that is taken, in its own spelling', async () => {
      mocked(dbInsertUserAlias).mockResolvedValueOnce(duplicateAlias('BerndH'))
      mocked(dbFindUserAliasesWithRegex).mockResolvedValue(['berndh'])

      await new RegisterUserRole(input()).run(logger)

      expect(dbInsertUserAlias).toHaveBeenLastCalledWith({
        alias: 'BerndHue',
        userId: USER_ID,
        origin: ALIAS_ORIGIN_ASSIGNED,
      })
      expect(dbUserUpdateField).toHaveBeenCalledWith(USER_ID, 'alias', 'BerndHue')
    })

    it('keeps the alias the member chose', async () => {
      await new RegisterUserRole(input({ alias: 'bernd-the-gardener' })).run(logger)
      expect(dbInsertUserAlias).toHaveBeenCalledWith({
        alias: 'bernd-the-gardener',
        userId: USER_ID,
        origin: ALIAS_ORIGIN_CHOSEN,
      })
    })

    // A name the system builds is a proposal and costs none of the member's four picks.
    it('hands out a proposal, not a pick, when the chosen alias is taken', async () => {
      mocked(dbInsertUserAlias).mockResolvedValueOnce(duplicateAlias('bernd-the-gardener'))

      await new RegisterUserRole(input({ alias: 'bernd-the-gardener' })).run(logger)

      expect(dbInsertUserAlias).toHaveBeenLastCalledWith({
        alias: 'BerndH',
        userId: USER_ID,
        origin: ALIAS_ORIGIN_ASSIGNED,
      })
    })
  })

  it('removes what it stored and sends nothing when storing fails half way', async () => {
    mocked(dbUserUpdateField).mockImplementation(async (_id, field) => (field === 'alias' ? 0 : 1))

    await expect(new RegisterUserRole(input()).run(logger)).rejects.toThrow(
      'Error while storing the generated alias',
    )
    expect(dbRemoveUser).toHaveBeenCalledWith(USER_ID)
    expect(dbRemoveUserContact).toHaveBeenCalledWith(CONTACT_ID)
    expect(dbRemoveUserAlias).toHaveBeenCalledWith(ALIAS_ID)
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

describe('RegisterUserExistRole', () => {
  const owner = { id: 3, firstName: 'Peter', lastName: 'Lustig', language: 'en' } as UserSelect

  it('tells the owner of the address, in their name and language, and opens nothing', async () => {
    const answer = await new RegisterUserExistRole(input(), owner).run(logger)

    expect(typeof answer).toBe('number')
    expect(sendAccountMultiRegistrationEmail).toHaveBeenCalledWith({
      firstName: 'Peter',
      lastName: 'Lustig',
      email: 'bernd@example.com',
      language: 'en',
    })
    expect(insertedEvents()).toEqual([
      { type: EventType.EMAIL_ACCOUNT_MULTIREGISTRATION, affectedUserId: 3, actingUserId: 0 },
    ])
    expect(dbInsertUser).not.toHaveBeenCalled()
  })
})

describe('RegisterUserReferrerRole', () => {
  it('records the owner of the address as referrer', async () => {
    mocked(dbFindLocalUserByAlias).mockResolvedValue({ id: REFERRER_ID } as UserSelect)

    await new RegisterUserReferrerRole(input({ referrerAlias: 'PeterL' })).run(logger)

    expect(dbInsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ referrerId: REFERRER_ID }),
      undefined,
    )
    expect(insertedEvents()).toContainEqual({
      type: EventType.USER_REGISTER,
      affectedUserId: USER_ID,
      actingUserId: REFERRER_ID,
    })
  })

  // Silence rule: an unknown address changes nothing - no error, and the answer is the same.
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
      undefined,
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
      undefined,
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

describe('RegisterUserCardRole', () => {
  const tx = { execute: jest.fn() }
  const cardInput = () =>
    input({ presenceCode: '1700000000.abc', password: 'Aa1!aaaa', referrerAlias: 'PeterL' })

  beforeEach(() => {
    mocked(verifyPresenceCode).mockReturnValue(true)
    mocked(dbFindLocalUserByAlias).mockResolvedValue({ id: REFERRER_ID } as UserSelect)
    mocked(dbCountUnconfirmedVouchedAccounts).mockResolvedValue(0)
    mocked(encryptPassword).mockResolvedValue(123n)
    mocked(drizzleDb).mockReturnValue({
      transaction: (run: (t: typeof tx) => Promise<number>) => run(tx),
    } as unknown as ReturnType<typeof drizzleDb>)
  })

  it('opens the account with the password, in the member’s name', async () => {
    expect(await new RegisterUserCardRole(cardInput()).run(logger)).toBe(USER_ID)

    expect(dbInsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        referrerId: REFERRER_ID,
        passwordEncryptionType: PasswordEncryptionType.GRADIDO_ID,
      }),
      tx,
    )
    expect(dbUserUpdatePassword).toHaveBeenCalledWith(
      USER_ID,
      PasswordEncryptionType.GRADIDO_ID,
      123n,
    )
    expect(insertedEvents()).toContainEqual({
      type: EventType.USER_REGISTER_PRESENCE,
      affectedUserId: USER_ID,
      actingUserId: REFERRER_ID,
    })
  })

  // The password exists already, so the set-password page would be the wrong door (EM-013).
  it('asks only to confirm the address', async () => {
    await new RegisterUserCardRole(cardInput()).run(logger)

    expect(sendAssistedRegistrationConfirmEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmLink: `${CONFIG.EMAIL_LINK_CONFIRM_EMAIL}${storedVerificationCode()}`,
      }),
    )
    expect(sendAccountActivationEmail).not.toHaveBeenCalled()
  })

  it('refuses an invalid code before anything is stored', async () => {
    mocked(verifyPresenceCode).mockReturnValue(false)

    await expect(new RegisterUserCardRole(cardInput()).run(logger)).rejects.toThrow(
      'Presence code invalid or expired',
    )
    expect(dbInsertUser).not.toHaveBeenCalled()
  })

  it('refuses when the member vouches for too many unconfirmed accounts', async () => {
    mocked(dbCountUnconfirmedVouchedAccounts).mockResolvedValue(PRESENCE_MAX_UNCONFIRMED)

    await expect(new RegisterUserCardRole(cardInput()).run(logger)).rejects.toThrow(
      'Vouching limit reached',
    )
    expect(dbInsertUser).not.toHaveBeenCalled()
  })

  it('refuses when the member behind the code is gone', async () => {
    mocked(dbFindLocalUserByAlias).mockResolvedValue(null)

    await expect(new RegisterUserCardRole(cardInput()).run(logger)).rejects.toThrow(
      'Presence code invalid or expired',
    )
    expect(dbInsertUser).not.toHaveBeenCalled()
  })
})
