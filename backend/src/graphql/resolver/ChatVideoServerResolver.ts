// AI-GENERATED — not an architecture reference
import { ChatVideoServerInput } from '@input/ChatVideoServerInput'
import { ChatVideoServerCheck } from '@model/ChatVideoServerCheck'
import { ChatVideoServerRow } from '@model/ChatVideoServerRow'
import {
  ChatVideoServerSelect,
  ChatVideoServerValues,
  DBNotFoundError,
  dbDeleteChatVideoServer,
  dbInsertChatVideoServer,
  dbSelectChatVideoServers,
  dbUpdateChatVideoServer,
} from 'database'
import { Arg, Authorized, Int, Mutation, Query, Resolver } from 'type-graphql'
import { ChatVideoServerState, chatVideoServerPool } from '@/apis/jitsi/chatVideoServerPool'
import { RIGHTS } from '@/auth/RIGHTS'
import {
  chatVideoServerChange,
  chatVideoServerFromForm,
  chatVideoServersFromRows,
} from '@/data/ChatVideoServer.logic'
import { LogError } from '@/server/LogError'

/**
 * A row with what the last check found about it -- found at THIS address. After a change of
 * address the row shows no check until the next one went there, rather than the old address's.
 */
const rowWithCheck = (
  row: ChatVideoServerSelect,
  state: ChatVideoServerState | undefined,
): ChatVideoServerRow =>
  new ChatVideoServerRow(
    row,
    state && state.server.baseUrl === row.baseUrl ? new ChatVideoServerCheck(state) : null,
  )

const stateOf = (id: number): ChatVideoServerState | undefined =>
  chatVideoServerPool.state().find((state) => state.id === id)

/** Every row, oldest first, each with what the last check found about it. */
const rowsWithChecks = async (): Promise<ChatVideoServerRow[]> => {
  const states = new Map(chatVideoServerPool.state().map((state) => [state.id, state]))
  return (await dbSelectChatVideoServers()).map((row) => rowWithCheck(row, states.get(row.id)))
}

/**
 * The row to store for what the administrator entered -- by the rules CHAT_VIDEO_SERVERS follows
 * -- or the error the admin page puts in words. A host names a server: a second row for one that
 * another row has is refused, whatever the path after it.
 */
const valuesFor = async (
  input: ChatVideoServerInput,
  id: number | null,
): Promise<{ values: Required<ChatVideoServerValues>; host: string }> => {
  const found = chatVideoServerFromForm(input)
  if (!found.success) {
    throw new LogError(`CHAT_VIDEO_SERVER_INVALID: ${found.error}`)
  }
  const { server, values } = found.value
  const others = (await dbSelectChatVideoServers()).filter((row) => row.id !== id)
  if (chatVideoServersFromRows(others).servers.some((other) => other.server.host === server.host)) {
    throw new LogError('CHAT_VIDEO_SERVER_DUPLICATE', server.host)
  }
  return { values, host: server.host }
}

/**
 * A check now, not waited for: the row just written is in the next list the pool reads, and the
 * page asks again for what it found. refreshNow never rejects -- it logs a check that fails.
 */
const checkSoon = (): void => {
  chatVideoServerPool.refreshNow()
}

/**
 * The admin page "Chat" (V3): the Jitsi servers the chat's video calls take a room from, with
 * the tick "in the random choice" and what the checks find. Administrators only: the list decides
 * whose servers the whole community's calls go to. The table is the list; CHAT_VIDEO_SERVERS only
 * fills it while it is empty (seedChatVideoServers).
 *
 * The log names the host and the reason, nothing else an administrator typed.
 */
@Resolver(() => ChatVideoServerRow)
export class ChatVideoServerResolver {
  @Authorized([RIGHTS.MANAGE_CHAT_VIDEO_SERVERS])
  @Query(() => [ChatVideoServerRow])
  async chatVideoServers(): Promise<ChatVideoServerRow[]> {
    return rowsWithChecks()
  }

  @Authorized([RIGHTS.MANAGE_CHAT_VIDEO_SERVERS])
  @Mutation(() => ChatVideoServerRow)
  async createChatVideoServer(
    @Arg('input', () => ChatVideoServerInput) input: ChatVideoServerInput,
  ): Promise<ChatVideoServerRow> {
    const { values, host } = await valuesFor(input, null)
    const result = await dbInsertChatVideoServer(values)
    if (!result.success) {
      throw new LogError('CHAT_VIDEO_SERVER_DUPLICATE', host)
    }
    checkSoon()
    return rowWithCheck(result.value, undefined)
  }

  @Authorized([RIGHTS.MANAGE_CHAT_VIDEO_SERVERS])
  @Mutation(() => ChatVideoServerRow)
  async updateChatVideoServer(
    @Arg('id', () => Int) id: number,
    @Arg('input', () => ChatVideoServerInput) input: ChatVideoServerInput,
  ): Promise<ChatVideoServerRow> {
    const { values, host } = await valuesFor(input, id)
    const result = await dbUpdateChatVideoServer(id, chatVideoServerChange(values, input.active))
    if (!result.success) {
      throw result.error instanceof DBNotFoundError
        ? new LogError('CHAT_VIDEO_SERVER_NOT_FOUND', id)
        : new LogError('CHAT_VIDEO_SERVER_DUPLICATE', host)
    }
    checkSoon()
    return rowWithCheck(result.value, stateOf(id))
  }

  @Authorized([RIGHTS.MANAGE_CHAT_VIDEO_SERVERS])
  @Mutation(() => Boolean)
  async deleteChatVideoServer(@Arg('id', () => Int) id: number): Promise<boolean> {
    const result = await dbDeleteChatVideoServer(id)
    if (!result.success) {
      throw new LogError('CHAT_VIDEO_SERVER_NOT_FOUND', id)
    }
    checkSoon()
    return true
  }

  /**
   * Checks every server now and waits for it -- a few seconds, as long as the slowest server
   * takes (5 s per request at most). A check under way is not doubled: this waits for it and the
   * round after it (refreshNow).
   */
  @Authorized([RIGHTS.MANAGE_CHAT_VIDEO_SERVERS])
  @Mutation(() => [ChatVideoServerRow])
  async checkChatVideoServersNow(): Promise<ChatVideoServerRow[]> {
    await chatVideoServerPool.refreshNow()
    return rowsWithChecks()
  }
}
