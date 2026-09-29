// AI-GENERATED — not an architecture reference
import { getLogger } from 'log4js'
import { CreateUser, createUserSchema } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'
import { RegisterUserForProjectRole } from './RegisterUserForProject.role'
import { registerUser } from './registerUser.context'

const logger = getLogger('test.registerUser.context')

const input = (extra: Record<string, unknown> = {}): CreateUser =>
  createUserSchema.parse({
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

  it('registers with a table code', async () => {
    const user = input({
      presenceCode: '1700000000.AbCdEfGhIjKlMnOpQrStUv',
      password: 'Aa1!aaaa',
      referrerAlias: 'PeterL',
    })
    expect(await roleChosenFor(user)).toBe('RegisterUserCardRole')
  })

  it('registers at somebody’s gradido address', async () => {
    expect(await roleChosenFor(input({ referrerAlias: 'PeterL' }))).toBe('RegisterUserReferrerRole')
  })

  it('registers plainly when nothing else came along', async () => {
    expect(await roleChosenFor(input())).toBe('RegisterUserRole')
  })
})
