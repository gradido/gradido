// AI-GENERATED — not an architecture reference
import { dbCountChatVideoServers, dbInsertChatVideoServer } from 'database'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  ChatVideoServerList,
  chatVideoServers,
  chatVideoServerValues,
} from '@/data/ChatVideoServer.logic'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.jitsi.seedChatVideoServers`)

/**
 * Fills chat_video_servers once: at the backend's start, while the table is empty, with the
 * servers of CHAT_VIDEO_SERVERS -- or, where that is empty, of the default list in the code --
 * each of them active, with its operator and prefix. A table with a single row is left as it
 * is: from the first start on the table is the list, kept on the admin page "Chat", and
 * CHAT_VIDEO_SERVERS is only what an empty table starts with.
 *
 * ⚠️ Empty is empty, however it got there: an administrator who deletes every row gets the seed
 * back at the next start. The admin page says so where the list is empty; switching a server
 * off is what takes it out of the calls.
 *
 * Called from index.ts before the pool's first check, so that the check finds the list. Never
 * throws: a list that could not be filled now is filled at the next start, and until then there
 * is no server to hand out -- which the query already says (CHAT_VIDEO_NO_SERVER).
 */
export async function seedChatVideoServers(
  list: () => ChatVideoServerList = chatVideoServers,
): Promise<void> {
  try {
    if ((await dbCountChatVideoServers()) > 0) {
      return
    }
    const { source, servers, rejected } = list()
    const from = source === 'DEFAULT' ? 'the default list' : 'CHAT_VIDEO_SERVERS'
    for (const { entry, reason } of rejected) {
      logger.warn(`chat video server left out: ${entry} (${reason})`)
    }
    if (servers.length === 0) {
      logger.error(`chat video servers: ${from} holds no usable entry -- the list stays empty`)
      return
    }
    let added = 0
    for (const server of servers) {
      // Refused only where the row is there already: another process filled the list meanwhile.
      if ((await dbInsertChatVideoServer(chatVideoServerValues(server))).success) {
        added += 1
      }
    }
    logger.info(`chat video servers: the list was empty -- filled with ${added} from ${from}`)
  } catch (error) {
    logger.error('filling the list of the chat video servers failed', error)
  }
}
