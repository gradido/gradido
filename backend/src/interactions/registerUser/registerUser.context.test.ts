// AI-GENERATED — not an architecture reference

import { getLogger } from 'log4js'
import * as v from 'valibot'
import { CreateUser, createUserSchema } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'
import { RegisterUserForProjectRole } from './RegisterUserForProject.role'
import { registerUser } from './registerUser.context'

const logger = getLogger('test.registerUser.context')

const input = (extra: Record<string, unknown> = {}): CreateUser =>
  v.parse(createUserSchema, {
    email: 'bernd@example.com',
    firstName: 'Bernd',
    lastName: 'Hückstädt',
    language: 'de',
    ...extra,
  })

// Which role ran, told by its class name. Every role's `run` is replaced: the flows
// themselves are tested in RegisterUser.role.test.ts, here only the choice between them.
async function roleChosenFor(user: CreateUser): Promise<string> {
  const runAs = function (this: object) {
    return Promise.resolve(this.constructor.name as unknown as number)
  }
  jest.spyOn(RegisterUserRole.prototype, 'run').mockImplementation(runAs)
  jest.spyOn(RegisterUserForProjectRole.prototype, 'run').mockImplementation(runAs)
  return (await registerUser(user, logger)) as unknown as string
}

describe('registerUser', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('registers for a project', async () => {
    expect(await roleChosenFor(input({ project: 'garden' }))).toBe('RegisterUserForProjectRole')
  })

  it('registers from a redeem code', async () => {
    expect(await roleChosenFor(input({ redeemCode: 'CL-abc' }))).toBe(
      'RegisterUserFromTransactionLinkRole',
    )
  })

  it('lets a redeem code win over the address the registration started at', async () => {
    expect(await roleChosenFor(input({ redeemCode: 'CL-abc', referrerAlias: 'PeterL' }))).toBe(
      'RegisterUserFromTransactionLinkRole',
    )
  })

  // A password with a redeem code: the link may vouch for the account. The role decides whether
  // it does; without a password it is not asked, and the registration is the one it was.
  it('lets the link decide when a redeem code comes with a password', async () => {
    expect(await roleChosenFor(input({ redeemCode: 'abc123', password: 'Aa1!aaaa' }))).toBe(
      'RegisterUserFromVouchingLinkRole',
    )
    expect(await roleChosenFor(input({ redeemCode: 'abc123' }))).toBe(
      'RegisterUserFromTransactionLinkRole',
    )
    expect(await roleChosenFor(input({ redeemCode: 'abc123', password: null }))).toBe(
      'RegisterUserFromTransactionLinkRole',
    )
  })

  // The order stays: a redeem code beats a guarantor code, which is not looked at then.
  it('lets a redeem code win over a guarantor code, with a password too', async () => {
    const user = input({
      redeemCode: 'abc123',
      guarantorCode: '1700000000.AbCdEfGhIjKlMnOpQrStUv',
      password: 'Aa1!aaaa',
    })
    expect(await roleChosenFor(user)).toBe('RegisterUserFromVouchingLinkRole')
  })

  // No member vouches for a project's registration, or for a plain one: the password is ignored.
  it('lets a password count for nothing with a project, at an address, or on its own', async () => {
    expect(
      await roleChosenFor(input({ project: 'garden', redeemCode: 'abc123', password: 'Aa1!aaaa' })),
    ).toBe('RegisterUserForProjectRole')
    expect(await roleChosenFor(input({ referrerAlias: 'PeterL', password: 'Aa1!aaaa' }))).toBe(
      'RegisterUserReferrerRole',
    )
    expect(await roleChosenFor(input({ password: 'Aa1!aaaa' }))).toBe('RegisterUserRole')
  })

  it('registers with a guarantor code', async () => {
    const user = input({
      guarantorCode: '1700000000.AbCdEfGhIjKlMnOpQrStUv',
      password: 'Aa1!aaaa',
      referrerAlias: 'PeterL',
    })
    expect(await roleChosenFor(user)).toBe('RegisterUserGuarantorRole')
  })

  // The page reached by its path sends the absent redeem code as '' - which took the
  // registration away from the guarantor code, and the guest had no password (staging).
  it('lets an empty redeem code decide nothing', async () => {
    const user = input({
      redeemCode: '',
      project: '',
      guarantorCode: '1700000000.AbCdEfGhIjKlMnOpQrStUv',
      password: 'Aa1!aaaa',
      referrerAlias: 'PeterL',
    })
    expect(await roleChosenFor(user)).toBe('RegisterUserGuarantorRole')
    expect(await roleChosenFor(input({ redeemCode: '', guarantorCode: '' }))).toBe(
      'RegisterUserRole',
    )
  })

  it('registers at somebody’s gradido address', async () => {
    expect(await roleChosenFor(input({ referrerAlias: 'PeterL' }))).toBe('RegisterUserReferrerRole')
  })

  it('registers plainly when nothing else came along', async () => {
    expect(await roleChosenFor(input())).toBe('RegisterUserRole')
  })
})
