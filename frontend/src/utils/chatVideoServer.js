// AI-GENERATED — not an architecture reference

/**
 * The server a member chose for their video calls (V5, Bernd, 27.09.2026: "Zurück · Planen",
 * the choice counts at once and stays): remembered per member on this device, as the box
 * "Start in the Jitsi app" is (chatVideoApp.js) -- never one key for everybody on the device.
 *
 * Only the row's id is kept. Which servers there are, and whether one answers, is the server's to
 * say, anew whenever the choice is shown (chatVideoServerChoices): a remembered server that is
 * not among them is no choice for this call, and stays remembered for when it is back.
 */
const SERVER_KEY_PREFIX = 'chat-video-server:'

const serverKey = (gradidoID) => (gradidoID ? `${SERVER_KEY_PREFIX}${gradidoID}` : null)

/** The server's id the member chose; null for none, for no member, or where storage throws. */
export const readChatVideoServer = (gradidoID) => {
  const key = serverKey(gradidoID)
  if (!key) return null
  try {
    const id = Number(window.localStorage.getItem(key))
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

/** Remembers the choice at once; none (null: at random) takes the key away. */
export const rememberChatVideoServer = (gradidoID, serverId) => {
  const key = serverKey(gradidoID)
  if (!key) return
  try {
    if (serverId) {
      window.localStorage.setItem(key, String(serverId))
    } else {
      window.localStorage.removeItem(key)
    }
  } catch {
    // A storage that refuses: the choice holds for this question and is not remembered.
  }
}

/** How a server reads in the choice: its host, then who runs it where the list names them. */
export const chatVideoServerLabel = ({ host, operator }) =>
  operator ? `${host} – ${operator}` : host

/** The server's answer where the chosen server is no longer to be had (V5). */
export const isChatVideoServerGone = (error) =>
  String(error?.message ?? '').includes('CHAT_VIDEO_SERVER_UNAVAILABLE')
