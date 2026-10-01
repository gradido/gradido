// AI-GENERATED — not an architecture reference
import { chatVideoDay, chatVideoInvitation, chatVideoZone } from '@/utils/chatVideoCalendar'
import { withChatVideoTopic } from '@/utils/chatVideoTopic'

/**
 * The words of a video invitation (V2, V4a, V5b), in ONE place: the question before a call writes
 * them when it starts or plans one (ChatVideoCall), and reads them back when an invitation is
 * changed (E-060). An ordinary chat message in the sender's language, the room's address at its
 * very end with nothing after it, so the thread's link finder takes it whole (chatTextParts).
 */

/**
 * The invitation for a room: its address with the topic -- and, planned, its time -- and the
 * message that carries it. Who runs the server is named in it; where the list names nobody, the
 * server's host.
 *
 * Four written-out keys, not one chosen by a condition, for the i18n lint. With the default topic
 * the invitation reads as it always did -- "Video call: Video call" would say it twice; with a
 * topic of one's own, the topic in words on a line of its own, since it may end on "?" or ".".
 * A planned call names the day and the time in the sender's language and time zone -- the zone
 * named, since the one invited may live in another.
 *
 * `revision` (E-060): of a planned call that was changed, the start it had first and the count of
 * its changes -- they travel in the address, for the calendars (chatVideoTopic).
 *
 * @param {{ t: Function, d: Function, locale: string }} i18n the member's language, as `useI18n` gives it (`locale` unwrapped)
 * @param {{ room: string, topic: string, when: { start: Date, end: Date } | null, operator: string, revision?: { first: Date, sequence: number } | null }} call
 * @returns {{ url: string, body: string }}
 */
export const chatVideoInviteBody = (
  { t, d, locale },
  { room, topic, when, operator, revision = null },
) => {
  const url = withChatVideoTopic(room, topic, when, revision)
  const plain = topic === t('chatThread.videoTopicDefault')
  if (!when) {
    return {
      url,
      body: plain
        ? t('chatThread.videoInvite', { operator, url })
        : t('chatThread.videoInviteTopic', { topic, operator, url }),
    }
  }
  const date = chatVideoDay(when.start, locale)
  const time = t('chatThread.videoPlannedTime', {
    from: d(when.start, 'time'),
    to: d(when.end, 'time'),
    zone: chatVideoZone(when.start, locale),
  })
  return {
    url,
    body: plain
      ? t('chatThread.videoInvitePlanned', { date, time, operator, url })
      : t('chatThread.videoInvitePlannedTopic', { topic, date, time, operator, url }),
  }
}

/** Stands in for the operator while an invitation is written to be compared; in no name. */
const OPERATOR_MARK = '\u0001'

/**
 * The video invitation a message IS (E-060): word for word what `chatVideoInviteBody` writes for
 * the room, the topic and the time its address carries -- in the member's language and time zone
 * as they are now --, with who runs the server as the message names them. `null` for every other
 * message: one without such an address, one written by hand around a room's address, one written
 * in another language or under another clock.
 *
 * ⛔ Why so strict: changing an invitation writes its words anew (`chatVideoInviteBody` with the
 * new topic and time). A message that only CONTAINS a room's address -- "here is the link for
 * Saturday: …" -- would lose the member's own words that way. Such a message is changed as the
 * text it is.
 *
 * @returns {{ room: string, topic: string, when: { start: Date, end: Date } | null, operator: string, revision: { first: Date, sequence: number } | null } | null}
 */
export const readChatVideoInvite = (i18n, text) => {
  const body = text ?? ''
  const invitation = chatVideoInvitation(body)
  if (!invitation) return null
  const when = invitation.start ? { start: invitation.start, end: invitation.end } : null
  const revision = invitation.first
    ? { first: invitation.first, sequence: invitation.sequence }
    : null
  const written = chatVideoInviteBody(i18n, {
    room: invitation.room,
    topic: invitation.topic,
    when,
    operator: OPERATOR_MARK,
    revision,
  }).body
  const at = written.indexOf(OPERATOR_MARK)
  if (at < 0 || written.indexOf(OPERATOR_MARK, at + 1) >= 0) return null
  const before = written.slice(0, at)
  const after = written.slice(at + 1)
  if (
    body.length <= before.length + after.length ||
    !body.startsWith(before) ||
    !body.endsWith(after)
  ) {
    return null
  }
  const operator = body.slice(before.length, body.length - after.length)
  if (/[\r\n]/.test(operator)) return null
  return { room: invitation.room, topic: invitation.topic, when, operator, revision }
}

/**
 * What a changed call carries for the calendars (E-060): the start it had first -- the one it
 * was changed from, where it was never changed before -- and one more change counted. null for a
 * call that has no time, and for one that gets its first time with this change: no calendar
 * holds it yet, and it is named by that start as a call newly planned is.
 *
 * @param {{ when: { start: Date } | null, revision: { first: Date, sequence: number } | null }} was the invitation before the change
 * @param {{ start: Date } | null} when the time it has now
 */
export const nextChatVideoRevision = (was, when) => {
  if (!when) return null
  if (!was.when) return null
  return {
    first: was.revision?.first ?? was.when.start,
    sequence: (was.revision?.sequence ?? 0) + 1,
  }
}

/**
 * The short message that follows a changed appointment (E-060 B4): what is now -- the topic, the
 * day and the time, in the sender's language and time zone. Two written-out keys, as above.
 */
export const chatVideoRescheduledBody = ({ t, d, locale }, { topic, when }) => {
  const date = chatVideoDay(when.start, locale)
  const time = t('chatThread.videoPlannedTime', {
    from: d(when.start, 'time'),
    to: d(when.end, 'time'),
    zone: chatVideoZone(when.start, locale),
  })
  return topic === t('chatThread.videoTopicDefault')
    ? t('chatThread.videoRescheduled', { date, time })
    : t('chatThread.videoRescheduledTopic', { topic, date, time })
}
