// AI-GENERATED — not an architecture reference
jest.mock('database', () => ({
  ...jest.requireActual('database'),
  dbFindUserByEmail: jest.fn(),
}))

import { dbFindUserByEmail, UserSelect } from 'database'
import { getLogger } from 'log4js'
import { CreateUser, createUserSchema } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'
import { RegisterUserExistRole } from './RegisterUserExist.role'
import { RegisterUserForProjectRole } from './RegisterUserForProject.role'
import { registerUser } from './registerUser.context'

const logger = getLogger('test.registerUser.context')

// Jest 27's types have no `jest.mocked`; this is the same, typed after the mocked function.
const mocked = <T extends (...args: never[]) => unknown>(fn: T) => fn as jest.MockedFunction<T>

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
  jest.spyOn(RegisterUserExistRole.prototype, 'run').mockImplementation(runAs)
  return (await registerUser(user, logger)) as unknown as string
}

describe('registerUser', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mocked(dbFindUserByEmail).mockResolvedValue(null)
  })

  it('answers a taken address without opening an account, whatever else came along', async () => {
    mocked(dbFindUserByEmail).mockResolvedValue({
      id: 1,
      firstName: 'Peter',
      lastName: 'Lustig',
    } as UserSelect)
    expect(await roleChosenFor(input({ project: 'garden' }))).toBe('RegisterUserExistRole')
  })

  it('registers for a project', async () => {
    expect(await roleChosenFor(input({ project: 'garden' }))).toBe('RegisterUserForProjectRole')
  })

  it('registers from a redeem code', async () => {
    expect(await roleChosenFor(input({ redeemCode: 'CL-abc' }))).toBe(
      'RegisterUserFromTransactionLinkRole',
    )
  })

  it('registers with a table code', async () => {
    const user = input({
      presenceCode: '1700000000.abc',
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
