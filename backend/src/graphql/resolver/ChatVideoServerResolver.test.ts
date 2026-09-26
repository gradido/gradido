// AI-GENERATED — not an architecture reference
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import { AppDatabase, chatVideoServersTable } from 'database'
import { chatVideoServerPool } from '@/apis/jitsi/chatVideoServerPool'
import { probeJitsiServer } from '@/apis/jitsi/jitsiProbe'
import { JitsiProbeError } from '@/apis/jitsi/jitsiProbe.logic'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { userFactory } from '@/seeds/factory/user'
import {
  checkChatVideoServersNow,
  createChatVideoServer,
  deleteChatVideoServer,
  login,
  updateChatVideoServer,
} from '@/seeds/graphql/mutations'
import { chatVideoServers } from '@/seeds/graphql/queries'
import { peterLustig } from '@/seeds/users/peter-lustig'

/**
 * The admin page's calls, as an administrator (the refusals: ChatVideoServerRights.test.ts).
 * No server is asked: the probe answers as each test says. The pool is the one of the process;
 * nothing starts its timer.
 */

jest.mock('@/password/EncryptorUtils')
jest.mock('@/apis/jitsi/jitsiProbe', () => ({ probeJitsiServer: jest.fn() }))
const probe = probeJitsiServer as jest.MockedFunction<typeof probeJitsiServer>

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

/** Every server answers in 42 ms, except those named, which do not answer at all. */
const serversAnswerBut = (down: string[] = []) =>
  probe.mockImplementation(async (server) =>
    down.includes(server.host)
      ? { success: false, error: new JitsiProbeError(server.host, 'UNREACHABLE', 'test') }
      : { success: true, value: { latencyMs: 42 } },
  )

// As an administrator types it: no slash at the end, spaces around the operator.
const FAIRMEETING = {
  baseUrl: 'https://fairmeeting.net',
  operator: ' fairmeeting (fairkom) ',
  roomPrefix: 'GradidoAkademie',
  note: 'Akademie-Lizenz',
  active: true,
}
const FFMUC = {
  baseUrl: 'https://meet.ffmuc.net/',
  operator: 'Freifunk München',
  roomPrefix: null,
  note: null,
  active: true,
}

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase

beforeAll(async () => {
  const testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  await userFactory(testEnv, peterLustig) // administrator
  resetToken()
  const { errors } = await mutate({
    mutation: login,
    variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
  })
  expect(errors).toBeUndefined()
})

beforeEach(async () => {
  jest.clearAllMocks()
  serversAnswerBut()
  // A check a mutation of the last test started, through before its rows go.
  await chatVideoServerPool.refreshNow()
  await db.getDrizzleDataSource().delete(chatVideoServersTable)
})

afterAll(async () => {
  await chatVideoServerPool.refreshNow()
  resetToken()
  await cleanDB()
  await db.destroy()
})

const create = (input: Record<string, unknown>): Promise<any> =>
  mutate({ mutation: createChatVideoServer, variables: { input } })
const update = (id: number, input: Record<string, unknown>): Promise<any> =>
  mutate({ mutation: updateChatVideoServer, variables: { id, input } })
const remove = (id: number): Promise<any> =>
  mutate({ mutation: deleteChatVideoServer, variables: { id } })
const checkNow = (): Promise<any> => mutate({ mutation: checkChatVideoServersNow })
const listed = async (): Promise<any[]> => {
  const { data, errors } = await query({ query: chatVideoServers })
  expect(errors).toBeUndefined()
  return data.chatVideoServers
}
const messagesOf = (result: any): string[] =>
  (result.errors ?? []).map((error: { message: string }) => error.message)

/** Creates a server that must be taken, and gives back its row. */
const created = async (input: Record<string, unknown>): Promise<any> => {
  const result = await create(input)
  expect(result.errors).toBeUndefined()
  return result.data.createChatVideoServer
}

/** The pool's check, held back: a mutation's check does not run while `run` goes on. */
const withoutChecks = async <T>(run: () => Promise<T>): Promise<T> => {
  const refreshNow = jest.spyOn(chatVideoServerPool, 'refreshNow').mockResolvedValue()
  try {
    return await run()
  } finally {
    refreshNow.mockRestore()
  }
}

describe('ChatVideoServerResolver', () => {
  it('creates a server as the rules make it: the address with its slash, fields trimmed', async () => {
    const row = await withoutChecks(() => created(FAIRMEETING))

    expect(row).toMatchObject({
      id: expect.any(Number),
      baseUrl: 'https://fairmeeting.net/',
      host: 'fairmeeting.net',
      operator: 'fairmeeting (fairkom)',
      roomPrefix: 'GradidoAkademie',
      note: 'Akademie-Lizenz',
      active: true,
      updatedAt: null,
      check: null,
    })
    expect(new Date(row.createdAt).getTime()).not.toBeNaN()
    expect(await listed()).toEqual([row])
  })

  it('stores empty fields as none', async () => {
    const row = await created({ ...FFMUC, operator: '  ', roomPrefix: '', note: ' ' })
    expect(row).toMatchObject({ operator: null, roomPrefix: null, note: null })
  })

  it('lists the servers oldest first', async () => {
    const first = await created(FFMUC)
    const second = await created(FAIRMEETING)
    expect((await listed()).map((row) => row.id)).toEqual([first.id, second.id])
  })

  it('refuses an entry the rules do not take, says why, and stores nothing', async () => {
    const refusal = async (change: Record<string, unknown>) =>
      messagesOf(await create({ ...FAIRMEETING, ...change }))

    expect(await refusal({ baseUrl: 'http://fairmeeting.net/' })).toEqual([
      'CHAT_VIDEO_SERVER_INVALID: NOT_HTTPS',
    ])
    expect(await refusal({ baseUrl: 'https://fairmeeting.net/?room=x' })).toEqual([
      'CHAT_VIDEO_SERVER_INVALID: NOT_A_BASE_ADDRESS',
    ])
    expect(await refusal({ roomPrefix: 'Gradido-Akademie' })).toEqual([
      'CHAT_VIDEO_SERVER_INVALID: BAD_PREFIX',
    ])
    expect(await refusal({ note: 'n'.repeat(256) })).toEqual([
      'CHAT_VIDEO_SERVER_INVALID: TOO_LONG',
    ])
    expect(await listed()).toEqual([])
  })

  it('refuses a second server for a host -- at the same address and at another path', async () => {
    await created(FAIRMEETING)
    expect(messagesOf(await create({ ...FAIRMEETING, note: 'twice' }))).toEqual([
      'CHAT_VIDEO_SERVER_DUPLICATE',
    ])
    expect(
      messagesOf(await create({ ...FAIRMEETING, baseUrl: 'https://FairMeeting.net/other/' })),
    ).toEqual(['CHAT_VIDEO_SERVER_DUPLICATE'])
    expect(await listed()).toHaveLength(1)
  })

  it('changes a server: note, tick and prefix, and says when', async () => {
    const row = await created(FAIRMEETING)
    const result = await update(row.id, {
      ...FAIRMEETING,
      note: 'Lizenz bis 2027',
      active: false,
      roomPrefix: 'GradidoTest',
    })

    expect(result.errors).toBeUndefined()
    expect(result.data.updateChatVideoServer).toMatchObject({
      id: row.id,
      baseUrl: 'https://fairmeeting.net/',
      note: 'Lizenz bis 2027',
      active: false,
      roomPrefix: 'GradidoTest',
    })
    expect(new Date(result.data.updateChatVideoServer.updatedAt).getTime()).not.toBeNaN()
    expect((await listed())[0]).toMatchObject({ note: 'Lizenz bis 2027', active: false })
  })

  it("refuses to move a server onto another's host, and leaves both as they were", async () => {
    const fairmeeting = await created(FAIRMEETING)
    const ffmuc = await created(FFMUC)
    const result = await update(ffmuc.id, { ...FFMUC, baseUrl: 'https://fairmeeting.net/x/' })

    expect(messagesOf(result)).toEqual(['CHAT_VIDEO_SERVER_DUPLICATE'])
    expect((await listed()).map((row) => [row.id, row.baseUrl])).toEqual([
      [fairmeeting.id, 'https://fairmeeting.net/'],
      [ffmuc.id, 'https://meet.ffmuc.net/'],
    ])
  })

  it('refuses a change that breaks a rule, and leaves the server as it was', async () => {
    const row = await created(FAIRMEETING)
    const result = await update(row.id, { ...FAIRMEETING, roomPrefix: 'mit Leerzeichen' })
    expect(messagesOf(result)).toEqual(['CHAT_VIDEO_SERVER_INVALID: BAD_PREFIX'])
    expect((await listed())[0]).toMatchObject({ roomPrefix: 'GradidoAkademie' })
  })

  it('answers CHAT_VIDEO_SERVER_NOT_FOUND for a server that is not there', async () => {
    const row = await created(FAIRMEETING)
    expect(messagesOf(await update(row.id + 1000, FFMUC))).toEqual(['CHAT_VIDEO_SERVER_NOT_FOUND'])
    expect(messagesOf(await remove(row.id + 1000))).toEqual(['CHAT_VIDEO_SERVER_NOT_FOUND'])
  })

  it('deletes a server', async () => {
    const fairmeeting = await created(FAIRMEETING)
    const ffmuc = await created(FFMUC)
    const result = await remove(fairmeeting.id)

    expect(result.errors).toBeUndefined()
    expect(result.data.deleteChatVideoServer).toBe(true)
    expect((await listed()).map((row) => row.id)).toEqual([ffmuc.id])
    expect(messagesOf(await remove(fairmeeting.id))).toEqual(['CHAT_VIDEO_SERVER_NOT_FOUND'])
  })

  it('shows no check before one went to a server, and what it found after one did', async () => {
    serversAnswerBut(['meet.ffmuc.net'])
    const [fairmeeting, ffmuc] = await withoutChecks(async () => [
      await created(FAIRMEETING),
      await created(FFMUC),
    ])
    expect((await listed()).map((row) => row.check)).toEqual([null, null])

    const result = await checkNow()
    expect(result.errors).toBeUndefined()
    const rows = result.data.checkChatVideoServersNow
    expect(rows.map((row: any) => row.id)).toEqual([fairmeeting.id, ffmuc.id])
    expect(rows[0].check).toMatchObject({ ok: true, reason: null, latencyMs: 42, picks: 0 })
    expect(rows[1].check).toMatchObject({
      ok: false,
      reason: 'UNREACHABLE',
      latencyMs: null,
      picks: 0,
    })
    expect(new Date(rows[0].check.checkedAt).getTime()).not.toBeNaN()
    // What the page reads afterwards is what the pool holds -- the same.
    expect((await listed()).map((row) => row.check)).toEqual(rows.map((row: any) => row.check))
  })

  it('checks a server switched off as well', async () => {
    const row = await withoutChecks(() => created({ ...FFMUC, active: false }))
    const [checked] = (await checkNow()).data.checkChatVideoServersNow
    expect(checked).toMatchObject({ id: row.id, active: false, check: { ok: true } })
  })

  // ⛔ A check is about the address it went to.
  it('shows no check for a server whose address changed, until the next check went there', async () => {
    const row = await created(FFMUC)
    await checkNow()
    expect((await listed())[0].check).toMatchObject({ ok: true })

    const moved = await withoutChecks(() =>
      update(row.id, { ...FFMUC, baseUrl: 'https://meet.systemli.org/', operator: 'Systemli' }),
    )
    expect(moved.data.updateChatVideoServer.check).toBeNull()
    expect((await listed())[0].check).toBeNull()

    await checkNow()
    expect((await listed())[0].check).toMatchObject({ ok: true })
  })

  it('asks the pool for a check after every change, and does not wait for it', async () => {
    // A check that never finishes: a mutation that waited for it would never answer. Raced
    // against two seconds rather than left to the test's timeout, so that such a mutation fails
    // this test alone and the spy is restored for the ones after it.
    const refreshNow = jest
      .spyOn(chatVideoServerPool, 'refreshNow')
      .mockReturnValue(new Promise<void>(() => undefined))
    const answered = async <T>(sending: Promise<T>): Promise<T | 'no answer'> => {
      let timer: NodeJS.Timeout | undefined
      try {
        return await Promise.race([
          sending,
          new Promise<'no answer'>((resolve) => {
            timer = setTimeout(() => resolve('no answer'), 2000)
          }),
        ])
      } finally {
        clearTimeout(timer)
      }
    }
    try {
      const creation = await answered(create(FAIRMEETING))
      expect(creation).not.toBe('no answer')
      const row = (creation as any).data.createChatVideoServer
      expect(refreshNow).toHaveBeenCalledTimes(1)
      const change = await answered(update(row.id, { ...FAIRMEETING, active: false }))
      expect(change).toMatchObject({ data: { updateChatVideoServer: { active: false } } })
      expect(refreshNow).toHaveBeenCalledTimes(2)
      expect(await answered(remove(row.id))).toMatchObject({
        data: { deleteChatVideoServer: true },
      })
      expect(refreshNow).toHaveBeenCalledTimes(3)
      // A refusal changes nothing, and asks for nothing.
      await create({ ...FAIRMEETING, baseUrl: 'http://fairmeeting.net/' })
      expect(refreshNow).toHaveBeenCalledTimes(3)
    } finally {
      refreshNow.mockRestore()
    }
  })

  // ⛔ An administrator's words stay out of the log: the host and the reason say enough.
  it('names the host and the reason in the log, and nothing else that was typed', async () => {
    const secret = {
      ...FFMUC,
      operator: 'Betreiber-Geheimnis',
      note: 'Notiz-Geheimnis',
      roomPrefix: 'PrefixGeheimnis',
    }
    await created(secret)
    await create(secret)
    await create({ ...secret, baseUrl: 'http://meet.ffmuc.net/' })

    expect(logErrorLogger.error).toHaveBeenCalledWith(
      'CHAT_VIDEO_SERVER_DUPLICATE',
      'meet.ffmuc.net',
    )
    expect(logErrorLogger.error).toHaveBeenCalledWith('CHAT_VIDEO_SERVER_INVALID: NOT_HTTPS')
    expect(JSON.stringify(logErrorLogger.error.mock.calls)).not.toMatch(/Geheimnis/)
  })
})
