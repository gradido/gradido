// AI-GENERATED — not an architecture reference
// Unit tests: the decision on its own, the query it asks replaced. No database: the query is
// tested against the database in `database` (transactions.test.ts), the whole way of a transfer
// that passes a thank-you on in TransactionResolver.passOn.test.ts.
//
// Written to run under jest and `bun test --isolate` alike (AGENTS.md): the factory hands out
// its own fakes, declared before `jest.mock`, and the module under test is imported in
// `beforeAll`, after every mock is registered.
import { Logger } from 'log4js'

const mockDatabase = {
  dbSelectReceivedTransferOfUser: jest.fn(),
  driverCodeOfFailedQuery: jest.fn(),
}
jest.mock('database', () => mockDatabase)

type TransactionPassOnModule = typeof import('./transactionPassOn')
let acceptedPassOnOrigin: TransactionPassOnModule['acceptedPassOnOrigin']

beforeAll(async () => {
  acceptedPassOnOrigin = (await import('./transactionPassOn')).acceptedPassOnOrigin
})

// reset, not only clear: a `mock…Once` a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
})

const logger = { warn: jest.fn(), error: jest.fn() }
const asLogger = logger as unknown as Logger

const EMMA = 4711
// Emma's own RECEIVE booking of the thank-you she passes on.
const RECEIVED = 1002

describe('acceptedPassOnOrigin', () => {
  it('asks nothing where no thank-you is named', async () => {
    expect(await acceptedPassOnOrigin(undefined, EMMA, asLogger)).toBeNull()
    expect(await acceptedPassOnOrigin(null, EMMA, asLogger)).toBeNull()

    expect(mockDatabase.dbSelectReceivedTransferOfUser).not.toHaveBeenCalled()
  })

  it('takes the thank-you where it is a booking the sender received', async () => {
    mockDatabase.dbSelectReceivedTransferOfUser.mockResolvedValue({
      success: true,
      value: { id: RECEIVED, senderIsMemberHere: true, senderUserId: 815, amount: null, memo: '' },
    })

    expect(await acceptedPassOnOrigin(RECEIVED, EMMA, asLogger)).toBe(RECEIVED)
    expect(mockDatabase.dbSelectReceivedTransferOfUser).toHaveBeenCalledWith(RECEIVED, EMMA)
  })

  // ⛔ Her own SEND row, somebody else's booking, an id without one: the query tells them apart
  // from her own RECEIVE row, not from each other. Dropped, and said in the log -- nobody else
  // hears of it.
  it('drops an id that is no thank-you the sender received, and says so in the log', async () => {
    mockDatabase.dbSelectReceivedTransferOfUser.mockResolvedValue({
      success: false,
      error: new Error('DB_NOT_FOUND'),
    })

    expect(await acceptedPassOnOrigin(RECEIVED, EMMA, asLogger)).toBeNull()
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('UNKNOWN_TRANSFER'), RECEIVED)
  })

  // ⛔ The trail must not stop a thank-you: a read that fails is a dropped trail, not a refused
  // transfer. Of the failure the log gets the driver's code -- never the statement.
  it('drops the thank-you where the read fails, and does not throw', async () => {
    const failure = new Error('Failed query: select `id` from `transactions` params: 1002,4711')
    mockDatabase.dbSelectReceivedTransferOfUser.mockRejectedValue(failure)
    mockDatabase.driverCodeOfFailedQuery.mockReturnValue('ECONNRESET')

    expect(await acceptedPassOnOrigin(RECEIVED, EMMA, asLogger)).toBeNull()
    expect(mockDatabase.driverCodeOfFailedQuery).toHaveBeenCalledWith(failure)
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('NOT_READ'),
      RECEIVED,
      'ECONNRESET',
    )
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('Failed query')
  })
})
