// AI-GENERATED — not an architecture reference
import { ref } from 'vue'
import { lookUpContactRow } from '@/composables/useContactWindow'
import { sendChatMessage } from '@/graphql/chat.graphql'
import { CHAT_NOTIFY_EMAIL } from '@/utils/chatNotify'

/** Nobody to ask about -- or the question did not get through. */
export const CHAT_HELLO_UNKNOWN = 'unknown'
/** The server is being asked whether the two are contacts already. */
export const CHAT_HELLO_ASKING = 'asking'
/** No contact: a first word can be written here. */
export const CHAT_HELLO_STRANGER = 'stranger'
/** A contact already: their conversation is where the two write. */
export const CHAT_HELLO_CONTACT = 'contact'

/**
 * The first word to somebody found on the map (E-065): whether it can be written here at all,
 * and the sending of it.
 *
 * The profile window of the map carries the chat's compose bar for somebody who is no contact
 * yet. What goes out is an ordinary first chat message: it goes by mail whatever is asked
 * (E-024, the server decides), and it makes the two contacts (KF-012). Somebody who is a contact
 * already has a conversation, or a place for one, in the contact window -- writing into it from
 * here, without seeing it, is not offered.
 *
 * ⛔ Every answer belongs to the person it was asked for (`asked`). The window is handed one
 * person after another, and an answer that comes late -- a contact row, a message's copy --
 * would otherwise put one person's standing, or "sent", under another's name. A message to
 * another community takes seconds.
 *
 * @param apolloClient the wallet's Apollo client
 */
export const useChatHello = (apolloClient) => {
  const standing = ref(CHAT_HELLO_UNKNOWN)
  const sending = ref(false)
  const failed = ref(false)
  /**
   * What became of the hello, or null while none went out: the server's own words about its
   * copy (E-019, E-034) -- `mailed` only where a mail went out, `delivery` the enum NAME
   * (DELIVERED, PENDING, FAILED).
   */
  const sent = ref(null)

  /** Which person the state above is about; null while it is about nobody. */
  let member = null
  /** Counts the persons asked about: an answer for an earlier one is let go. */
  let asked = 0

  /**
   * The window shows this person now -- or nobody (null). Everything said about the one before
   * is let go, and the server is asked whether the two are contacts already.
   *
   * A question that does not get through ends as "unknown": no first word is offered on a
   * guess. To a contact it would be a message into a conversation the member does not see from
   * here, under a note about a "first message" that it is not.
   *
   * @param {{ gradidoID: string, communityUuid: string } | null} person
   */
  const ask = async (person) => {
    asked += 1
    const mine = asked
    member = person
    standing.value = CHAT_HELLO_UNKNOWN
    sending.value = false
    failed.value = false
    sent.value = null
    if (!person) return
    standing.value = CHAT_HELLO_ASKING
    let known = CHAT_HELLO_UNKNOWN
    try {
      const contact = await lookUpContactRow(apolloClient, person)
      known = contact ? CHAT_HELLO_CONTACT : CHAT_HELLO_STRANGER
    } catch {
      // Unknown, as above.
    }
    if (mine !== asked) return
    standing.value = known
  }

  /**
   * Sends the hello: to somebody the server said is no contact yet, once, and not while one is
   * on its way to them from this window as it stands. (A window shut and opened again asks the
   * server anew -- a hello that is filed by then makes the two contacts, and no bar is shown.)
   *
   * ⛔ A press after an attempt that did not come back asks the server first. "Did not come
   * back" is not "did not go": the server files the message and then waits -- for the mail, or
   * for the other community -- and the answer can be lost on the way here (a phone put aside, a
   * connection gone). The second press would then be a second hello and a second mail to
   * somebody who has the first. If the two are contacts by now, nothing is sent: the bar gives
   * way to the way into their conversation, where the first one stands. If the server cannot be
   * asked, nothing is sent either, and the bar keeps the words.
   *
   * ⚠️ `failed` and `sending` change in one synchronous step, as the thread's do: the compose
   * bar reads "no longer sending, not failed" as "it went through" and empties its field.
   *
   * @param {string} body the words as they stand in the field
   */
  const send = async (body) => {
    if (sending.value || sent.value || standing.value !== CHAT_HELLO_STRANGER) return
    const mine = asked
    const to = member
    sending.value = true
    if (failed.value) {
      let contact = null
      let answered = true
      try {
        contact = await lookUpContactRow(apolloClient, to)
      } catch {
        answered = false
      }
      if (mine !== asked) return
      if (!answered || contact) {
        if (contact) standing.value = CHAT_HELLO_CONTACT
        failed.value = !contact
        sending.value = false
        return
      }
    }
    failed.value = false
    let own = null
    try {
      const answer = await apolloClient.mutate({
        mutation: sendChatMessage,
        variables: {
          ref: { gradidoID: to.gradidoID, communityUuid: to.communityUuid },
          body,
          // The first message of two goes by mail whatever is asked; asking for it keeps the
          // request honest about what will happen (utils/chatNotify).
          notify: CHAT_NOTIFY_EMAIL,
        },
      })
      own = answer?.data?.sendChatMessage ?? null
    } catch {
      own = null
    }
    // The window has moved on to somebody else: this answer is not theirs.
    if (mine !== asked) return
    if (own) {
      sent.value = { mailed: own.mailState === 'MAILED', delivery: own.deliveryState ?? null }
    }
    failed.value = own === null
    sending.value = false
  }

  return { standing, sending, failed, sent, ask, send }
}
