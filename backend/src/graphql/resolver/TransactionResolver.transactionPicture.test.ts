// AI-GENERATED — not an architecture reference
import { inspect } from 'node:util'
import { TEST_PICTURE_BASE64, TEST_PICTURE_SIZE } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import { processXComCompleteTransaction, transferTransaction } from 'core'
import {
  AppDatabase,
  countOpenPendingTransactions,
  DBInsertFailed,
  DBNotFoundError,
  User as DbUser,
  dbDeleteTransactionPictureWithoutBooking,
  dbInsertEvent,
  dbInsertTransactionPicture,
  dbSelectTransactionPictureImageForMember,
  findUserByIdentifier,
  TransactionPictureNotFiled,
} from 'database'
import { CHAT_IMAGE_MAX_BYTES, GradidoUnit } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { TRANSACTION_PICTURES_MAX_PER_REQUEST } from '@/data/TransactionPicture.logic'
import { Context, newRequestBudget } from '@/server/context'
import { calculateBalance } from '@/util/validate'
import { TransactionSendArgs } from '../arg/TransactionSendArgs'
import { executeTransaction, TransactionResolver } from './TransactionResolver'
import { isHomeCommunity } from './util/communities'

// What the database answers is mocked here: the subject is what the resolver decides itself --
// the order a transfer with a picture runs in, what a failure leaves behind, and what the query
// for the photo hands on. TransactionResolver.picture.test.ts runs the same ways against a
// database.
//
// Every step that matters writes its name into `steps`, so that a test reads the order.
const steps: string[] = []

jest.mock('database', () => {
  const original = jest.requireActual('database')
  return {
    __esModule: true,
    ...original,
    findUserByIdentifier: jest.fn(),
    countOpenPendingTransactions: jest.fn(),
    dbInsertEvent: jest.fn(),
    dbInsertTransactionPicture: jest.fn(),
    dbDeleteTransactionPictureWithoutBooking: jest.fn(),
    dbSelectTransactionPictureImageForMember: jest.fn(),
  }
})
jest.mock('core', () => {
  const original = jest.requireActual('core')
  return {
    __esModule: true,
    ...original,
    transferTransaction: jest.fn(),
    processXComCompleteTransaction: jest.fn(),
    sendTransactionReceivedEmail: jest.fn(async () => null),
  }
})
jest.mock('redis-semaphore', () => ({
  Mutex: jest.fn().mockImplementation(() => ({
    acquire: jest.fn(async () => {
      steps.push('mutex')
    }),
    release: jest.fn(async () => {
      steps.push('mutex released')
    }),
  })),
}))
jest.mock('./util/communities', () => {
  const original = jest.requireActual('./util/communities')
  return { __esModule: true, ...original, isHomeCommunity: jest.fn() }
})
jest.mock('@/util/validate', () => {
  const original = jest.requireActual('@/util/validate')
  return { __esModule: true, ...original, calculateBalance: jest.fn() }
})

const findRecipient = findUserByIdentifier as jest.MockedFunction<typeof findUserByIdentifier>
const openPending = countOpenPendingTransactions as jest.MockedFunction<
  typeof countOpenPendingTransactions
>
const insertEvent = dbInsertEvent as jest.MockedFunction<typeof dbInsertEvent>
const filePicture = dbInsertTransactionPicture as jest.MockedFunction<
  typeof dbInsertTransactionPicture
>
const removePicture = dbDeleteTransactionPictureWithoutBooking as jest.MockedFunction<
  typeof dbDeleteTransactionPictureWithoutBooking
>
const photoFor = dbSelectTransactionPictureImageForMember as jest.MockedFunction<
  typeof dbSelectTransactionPictureImageForMember
>
const dlt = transferTransaction as jest.MockedFunction<typeof transferTransaction>
const acrossTheBorder = processXComCompleteTransaction as jest.MockedFunction<
  typeof processXComCompleteTransaction
>
const atHome = isHomeCommunity as jest.MockedFunction<typeof isHomeCommunity>
const balanceAfter = calculateBalance as jest.MockedFunction<typeof calculateBalance>

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
const resolverLogger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.TransactionResolver`,
)

const HOME = '11111111-1111-4111-8111-111111111111'
const ELSEWHERE = '22222222-2222-4222-8222-222222222222'
const EMMA = 4711
const DAVE = 815
const PICTURE_ID = 31

const member = (id: number, alias: string): DbUser =>
  ({
    id,
    alias,
    gradidoID: `00000000-0000-4000-8000-00000000${id}`,
    communityUuid: HOME,
    firstName: alias,
    lastName: 'Test',
    language: 'de',
    foreign: false,
    emailContact: { email: `${alias}@example.org` },
  }) as unknown as DbUser

const emma = member(EMMA, 'Oma-Emma')
const dave = member(DAVE, 'Dave-Bank')

/** A request of this member's, with a budget of its own. */
const requestOf = (user: DbUser | undefined = emma): Context => ({
  token: null,
  setHeaders: [],
  requestBudget: newRequestBudget(),
  user,
})

// A JPEG with something recognisable inside: what a log or an answer says is searched for it.
const SECRET = 'a private photo of the bench Dave built'
// It decodes (test/helpers.ts), and the secret stands in a comment segment of the file: the
// server stores the picture decoded and encoded again -- STORED, the same pixels without it.
const STORED = Buffer.from(TEST_PICTURE_BASE64, 'base64')
const PHOTO = Buffer.concat([
  STORED.subarray(0, 2),
  Buffer.from([0xff, 0xfe, 0x00, SECRET.length + 2]),
  Buffer.from(SECRET),
  STORED.subarray(2),
])
const PHOTO_BASE64 = PHOTO.toString('base64')
const photoInput = { data: PHOTO_BASE64, width: 831, height: 577 }

const transfer = (rest: Partial<TransactionSendArgs> = {}): TransactionSendArgs => ({
  recipientCommunityIdentifier: HOME,
  recipientIdentifier: 'Dave-Bank',
  amount: new GradidoUnit(500000n),
  memo: 'Für die Bank.',
  ...rest,
})

const send = (args: Partial<TransactionSendArgs> = {}, context = requestOf()) =>
  new TransactionResolver().sendCoins(transfer(args), context)

/** The rows the booking wrote, in the order it wrote them. */
let inserted: Array<Record<string, unknown>>

const enough = {
  balance: new GradidoUnit(1000000n),
  decay: { decay: new GradidoUnit(0n), start: null },
  lastTransactionId: 1,
}

/** Everything any log of this file was told, and everything an error says. */
const saidAnywhere = (failure?: unknown): string =>
  [
    inspect(failure, { depth: 8 }),
    failure instanceof Error ? `${failure.message}\n${failure.stack}` : '',
    inspect(logErrorLogger.error.mock.calls, { depth: 8 }),
    ...(['debug', 'info', 'warn', 'error', 'trace'] as const).map((level) =>
      inspect((resolverLogger as any)[level]?.mock?.calls ?? [], { depth: 8 }),
    ),
  ].join('\n')

beforeEach(() => {
  jest.clearAllMocks()
  steps.length = 0
  inserted = []
  let nextId = 100
  const queryRunner = {
    connect: jest.fn(async () => undefined),
    startTransaction: jest.fn(async () => undefined),
    commitTransaction: jest.fn(async () => {
      steps.push('commit')
    }),
    rollbackTransaction: jest.fn(async () => {
      steps.push('rollback')
    }),
    release: jest.fn(async () => undefined),
    manager: {
      insert: jest.fn(async (_entity: unknown, row: Record<string, unknown>) => {
        row.id = nextId++
        inserted.push({ ...row })
        steps.push(`row ${String(row.typeId)}`)
      }),
      update: jest.fn(async () => undefined),
    },
  }
  const db = AppDatabase.getInstance()
  jest.spyOn(db, 'getRedisClient').mockReturnValue({} as never)
  jest.spyOn(db, 'getDataSource').mockReturnValue({ createQueryRunner: () => queryRunner } as never)

  atHome.mockImplementation(async (identifier) => identifier === HOME)
  findRecipient.mockImplementation(async () => {
    steps.push('recipient found')
    return dave
  })
  openPending.mockResolvedValue(0)
  balanceAfter.mockImplementation(async () => {
    steps.push('balance')
    return enough as never
  })
  insertEvent.mockImplementation(async () => {
    steps.push('event')
    return undefined as never
  })
  dlt.mockImplementation(async () => {
    steps.push('dlt')
    return null
  })
  acrossTheBorder.mockImplementation(async () => {
    steps.push('across the border')
    return undefined as never
  })
  filePicture.mockImplementation(async () => {
    steps.push('picture filed')
    return { success: true, value: PICTURE_ID }
  })
  removePicture.mockImplementation(async () => {
    steps.push('picture removal asked')
    return true
  })
})

describe('sendCoins with a picture', () => {
  it('files a motif before the booking, the mutex and the DLT, and books it onto both rows', async () => {
    expect(await send({ motif: 'giving-hands' })).toBe(true)

    expect(filePicture).toHaveBeenCalledTimes(1)
    expect(filePicture).toHaveBeenCalledWith({ motif: 'giving-hands' })
    expect(steps.indexOf('picture filed')).toBeGreaterThan(steps.indexOf('recipient found'))
    expect(steps.indexOf('picture filed')).toBeLessThan(steps.indexOf('mutex'))
    expect(steps.indexOf('picture filed')).toBeLessThan(steps.indexOf('dlt'))
    expect(inserted).toHaveLength(2)
    expect(inserted.map((row) => row.transactionPictureId)).toEqual([PICTURE_ID, PICTURE_ID])
    expect(removePicture).not.toHaveBeenCalled()
  })

  // ⛔ A document may repeat the mutation under aliases, with one photo in its variables.
  it('takes one photo in an HTTP request, and does no work on a second', async () => {
    const context = requestOf()

    expect(await send({ picture: photoInput }, context)).toBe(true)
    await expect(send({ picture: photoInput }, context)).rejects.toThrow(
      'Too many pictures sent at once',
    )
    // Refused before the picture is looked at: not even what is no picture gets its own answer.
    await expect(send({ picture: { ...photoInput, data: '' } }, context)).rejects.toThrow(
      'Too many pictures sent at once',
    )

    expect(filePicture).toHaveBeenCalledTimes(1)
    // A motif costs no encoding and is not counted, and another request has a budget of its own.
    expect(await send({ motif: 'bouquet' }, context)).toBe(true)
    expect(await send({ picture: photoInput })).toBe(true)
  })

  it('files a photo encoded again at the size it has, and nothing else of the request', async () => {
    expect(await send({ picture: photoInput })).toBe(true)

    expect(filePicture).toHaveBeenCalledTimes(1)
    const [filed] = filePicture.mock.calls[0]
    expect(Object.keys(filed)).toEqual(['photo'])
    // The picture encoded again, at the size it has -- not the bytes and the size as sent.
    expect('photo' in filed && Buffer.compare(filed.photo.image, STORED)).toBe(0)
    expect('photo' in filed && filed.photo.image.includes(SECRET)).toBe(false)
    expect('photo' in filed && [filed.photo.width, filed.photo.height]).toEqual([
      TEST_PICTURE_SIZE.width,
      TEST_PICTURE_SIZE.height,
    ])
    expect(inserted.map((row) => row.transactionPictureId)).toEqual([PICTURE_ID, PICTURE_ID])
  })

  it('asks the two cheap refusals before it files: oneself, then the balance', async () => {
    await send({ motif: 'bouquet' })

    // The first `balance` is sendCoins' own look; executeTransaction asks again, and decides.
    expect(steps.indexOf('balance')).toBeLessThan(steps.indexOf('picture filed'))
    expect(steps.filter((step) => step === 'balance').length).toBeGreaterThanOrEqual(2)
  })

  it('refuses a transfer to oneself before anything is filed', async () => {
    findRecipient.mockResolvedValue(emma)

    await expect(send({ motif: 'bouquet' })).rejects.toThrow('Sender and Recipient are the same')

    expect(filePicture).not.toHaveBeenCalled()
    expect(removePicture).not.toHaveBeenCalled()
    expect(dlt).not.toHaveBeenCalled()
    expect(inserted).toEqual([])
  })

  it('refuses a transfer the balance does not cover before anything is filed', async () => {
    balanceAfter.mockResolvedValue(null as never)

    await expect(send({ picture: photoInput })).rejects.toThrow(
      'User has not enough GDD or amount is < 0',
    )

    expect(filePicture).not.toHaveBeenCalled()
    expect(removePicture).not.toHaveBeenCalled()
    expect(dlt).not.toHaveBeenCalled()
    expect(inserted).toEqual([])
  })

  describe('what is refused before anything is read or written', () => {
    const untouched = () => {
      expect(atHome).not.toHaveBeenCalled()
      expect(findRecipient).not.toHaveBeenCalled()
      expect(balanceAfter).not.toHaveBeenCalled()
      expect(filePicture).not.toHaveBeenCalled()
      expect(dlt).not.toHaveBeenCalled()
      expect(acrossTheBorder).not.toHaveBeenCalled()
      expect(inserted).toEqual([])
      expect(steps).toEqual([])
    }

    it('a motif and a photo at once', async () => {
      await expect(send({ motif: 'bouquet', picture: photoInput })).rejects.toThrow(
        'Transfer picture: a motif or a photo, not both',
      )
      untouched()
    })

    it('a motif the server does not know', async () => {
      await expect(send({ motif: 'elephant' })).rejects.toThrow('Transfer picture: unknown motif')
      untouched()
    })

    it('a photo that is too large', async () => {
      const tooLarge = Buffer.concat([
        Buffer.from([0xff, 0xd8]),
        Buffer.alloc(CHAT_IMAGE_MAX_BYTES),
        Buffer.from([0xff, 0xd9]),
      ]).toString('base64')

      await expect(send({ picture: { ...photoInput, data: tooLarge } })).rejects.toThrow(
        'CHAT_IMAGE_NOT_ACCEPTED: TOO_LARGE',
      )
      untouched()
    })

    it('a photo that is no JPEG', async () => {
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0xff, 0xd9]).toString('base64')

      await expect(send({ picture: { ...photoInput, data: png } })).rejects.toThrow(
        'CHAT_IMAGE_NOT_ACCEPTED: NOT_JPEG',
      )
      untouched()
    })

    it('an empty photo', async () => {
      await expect(send({ picture: { ...photoInput, data: '' } })).rejects.toThrow(
        'CHAT_IMAGE_NOT_ACCEPTED: EMPTY',
      )
      untouched()
    })
  })

  it('refuses a picture to a member of another community before that community hears of it', async () => {
    for (const picture of [{ motif: 'bouquet' }, { picture: photoInput }]) {
      await expect(send({ recipientCommunityIdentifier: ELSEWHERE, ...picture })).rejects.toThrow(
        'A picture can only be sent to a member of the own community',
      )
    }

    expect(acrossTheBorder).not.toHaveBeenCalled()
    expect(filePicture).not.toHaveBeenCalled()
    expect(dlt).not.toHaveBeenCalled()
    expect(inserted).toEqual([])
  })

  describe('where the picture cannot be filed', () => {
    beforeEach(() => {
      filePicture.mockResolvedValue({
        success: false,
        error: new DBInsertFailed<TransactionPictureNotFiled>('transaction_picture_images', {
          row: 'transaction_picture_images',
          driverCode: 'ER_LOCK_WAIT_TIMEOUT',
        }),
      })
    })

    it('nothing is booked, the DLT hears nothing and nothing is taken out', async () => {
      await expect(send({ picture: photoInput })).rejects.toThrow(
        'Unable to save the picture of the transfer',
      )

      expect(inserted).toEqual([])
      expect(dlt).not.toHaveBeenCalled()
      expect(steps).not.toContain('mutex')
      expect(removePicture).not.toHaveBeenCalled()
    })

    it('the error and the log say which row and the driver’s code, and no byte of the picture', async () => {
      const failure = await send({ picture: photoInput }).catch((e) => e)

      expect(failure).toBeInstanceOf(Error)
      expect(failure.message).toBe('Unable to save the picture of the transfer')
      expect(logErrorLogger.error).toHaveBeenCalledWith(
        'Unable to save the picture of the transfer',
        { row: 'transaction_picture_images', driverCode: 'ER_LOCK_WAIT_TIMEOUT' },
      )
      const said = saidAnywhere(failure)
      expect(said).not.toContain(PHOTO_BASE64)
      expect(said).not.toContain(SECRET)
      expect(said).not.toContain('Failed query')
    })
  })

  describe('where the booking is not made after the picture was filed', () => {
    it('takes the picture back out, asked of the sender’s rows, and hands the failure on unchanged', async () => {
      openPending.mockResolvedValue(1)

      const failure = await send({ picture: photoInput }).catch((e) => e)

      expect(failure.message).toContain("There exist still ongoing 'Pending-Transactions'")
      expect(inserted).toEqual([])
      expect(removePicture).toHaveBeenCalledTimes(1)
      expect(removePicture).toHaveBeenCalledWith(PICTURE_ID, EMMA)
      expect(steps.indexOf('picture removal asked')).toBeGreaterThan(
        steps.indexOf('mutex released'),
      )
    })

    it('hands the failure of the transfer on where the removal fails as well, and logs the driver’s code only', async () => {
      openPending.mockResolvedValue(1)
      removePicture.mockRejectedValue(
        Object.assign(
          new Error(`Failed query: delete from transaction_pictures params: ${PICTURE_ID}`),
          {
            cause: { code: 'ECONNRESET' },
          },
        ),
      )

      const failure = await send({ motif: 'bouquet' }).catch((e) => e)

      expect(failure.message).toContain("There exist still ongoing 'Pending-Transactions'")
      expect(saidAnywhere(failure)).not.toContain('Failed query')
      expect(resolverLogger.error).toHaveBeenCalledWith(
        'picture of a transfer that was not booked could not be removed',
        PICTURE_ID,
        'ECONNRESET',
      )
    })

    // ⚠️ A throw does not prove that nothing was booked: after the commit an event may throw.
    // The removal is asked all the same -- and the QUERY decides, in the statement that deletes,
    // that a picture a booking carries stays (transactionPictures.test.ts in `database`).
    it('asks for the removal after a throw past the commit too, with both rows written', async () => {
      insertEvent.mockRejectedValueOnce(new Error('event table gone'))

      await expect(send({ picture: photoInput })).rejects.toThrow()

      expect(steps).toContain('commit')
      expect(inserted.map((row) => row.transactionPictureId)).toEqual([PICTURE_ID, PICTURE_ID])
      expect(removePicture).toHaveBeenCalledWith(PICTURE_ID, EMMA)
    })
  })

  it('writes of the picture into the log that there is one, and of which kind', async () => {
    await send({ picture: photoInput })

    const debugged = inspect(resolverLogger.debug.mock.calls, { depth: 6 })
    expect(debugged).toContain('picture=photo')
    expect(saidAnywhere()).not.toContain(PHOTO_BASE64)
    expect(saidAnywhere()).not.toContain(SECRET)

    jest.clearAllMocks()
    await send({ motif: 'bouquet' })
    expect(inspect(resolverLogger.debug.mock.calls, { depth: 6 })).toContain('picture=motif')
  })
})

describe('sendCoins without a picture', () => {
  it('runs as before: nothing is filed, nothing asked ahead, both rows without a picture', async () => {
    expect(await send()).toBe(true)

    expect(filePicture).not.toHaveBeenCalled()
    expect(removePicture).not.toHaveBeenCalled()
    expect(inserted).toHaveLength(2)
    expect(inserted.map((row) => row.transactionPictureId)).toEqual([null, null])
    // executeTransaction's own two looks at the balance, and no third ahead of them.
    expect(steps.indexOf('balance')).toBeGreaterThan(steps.indexOf('mutex'))
    expect(inspect(resolverLogger.debug.mock.calls, { depth: 6 })).toContain('picture=none')
  })

  it('takes null for either argument as none', async () => {
    expect(await send({ motif: null, picture: null })).toBe(true)

    expect(filePicture).not.toHaveBeenCalled()
    expect(inserted.map((row) => row.transactionPictureId)).toEqual([null, null])
  })

  it('goes across the border as before', async () => {
    expect(await send({ recipientCommunityIdentifier: ELSEWHERE })).toBe(true)

    expect(acrossTheBorder).toHaveBeenCalledTimes(1)
    expect(filePicture).not.toHaveBeenCalled()
  })

  it('takes nothing out where a transfer without a picture fails', async () => {
    openPending.mockResolvedValue(1)

    await expect(send()).rejects.toThrow()

    expect(removePicture).not.toHaveBeenCalled()
  })
})

describe('executeTransaction called by the two other callers', () => {
  const logger = getLogger('test') as never

  it('writes no picture where none is passed -- a link accepted, a thank-you card', async () => {
    await executeTransaction(new GradidoUnit(500000n), 'memo memo', emma, dave, logger, null, 7)

    expect(inserted).toHaveLength(2)
    expect(inserted.map((row) => row.transactionPictureId)).toEqual([null, null])
    expect(inserted.map((row) => row.thankYouCardId)).toEqual([7, 7])
  })
})

describe('transactionPicture', () => {
  const SEND_ROW = 1001
  const ask = (context = requestOf(), transactionId = SEND_ROW) =>
    new TransactionResolver().transactionPicture(transactionId, context)
  const notFound = () => ({
    success: false as const,
    error: new DBNotFoundError('transaction_picture_images', 'the picture of a booking'),
  })

  beforeEach(() => {
    photoFor.mockResolvedValue({ success: true, value: PHOTO })
  })

  it('hands the photo on as base64, asked with the booking’s id and the caller’s own id', async () => {
    expect(await ask()).toBe(PHOTO_BASE64)

    expect(photoFor).toHaveBeenCalledTimes(1)
    expect(photoFor).toHaveBeenCalledWith(SEND_ROW, EMMA)
  })

  it('asks for the recipient with the recipient’s id', async () => {
    await ask(requestOf(dave), 1002)

    expect(photoFor).toHaveBeenCalledWith(1002, DAVE)
  })

  it('answers null where the query finds nothing, whatever the reason', async () => {
    photoFor.mockResolvedValue(notFound())

    expect(await ask()).toBeNull()
  })

  it('serves as many in one request as the budget allows, and not one more', async () => {
    const context = requestOf()
    for (let n = 0; n < TRANSACTION_PICTURES_MAX_PER_REQUEST; n++) {
      expect(await ask(context)).toBe(PHOTO_BASE64)
    }

    await expect(ask(context)).rejects.toThrow('Too many transaction pictures requested at once')

    // ⛔ The one too many was never read.
    expect(photoFor).toHaveBeenCalledTimes(TRANSACTION_PICTURES_MAX_PER_REQUEST)
    expect(context.requestBudget.transactionPicturesServed).toBe(
      TRANSACTION_PICTURES_MAX_PER_REQUEST + 1,
    )
  })

  it('counts before anything is read -- also where nobody is signed in', async () => {
    const context = requestOf()
    context.user = undefined

    await expect(ask(context)).rejects.toThrow('No user given in context')

    expect(context.requestBudget.transactionPicturesServed).toBe(1)
    expect(photoFor).not.toHaveBeenCalled()
  })

  it('counts a request that found nothing as well: its answer stays out of the log', async () => {
    photoFor.mockResolvedValue(notFound())
    const context = requestOf()

    await ask(context)

    expect(context.requestBudget.transactionPicturesServed).toBe(1)
  })

  it('says of a failed read that it failed, and the driver’s code -- no statement, no parameter', async () => {
    photoFor.mockRejectedValue(
      Object.assign(
        new Error(
          `Failed query: select \`image\` from \`transaction_picture_images\` params: ${SEND_ROW}`,
        ),
        { cause: { code: 'ECONNRESET' } },
      ),
    )

    const failure = await ask().catch((e) => e)

    expect(failure).toBeInstanceOf(Error)
    expect(failure.message).toBe('Unable to read transaction picture')
    expect(logErrorLogger.error).toHaveBeenCalledWith(
      'Unable to read transaction picture',
      'ECONNRESET',
    )
    const said = saidAnywhere(failure)
    expect(said).not.toContain('Failed query')
    expect(said).not.toContain('select')
  })
})
