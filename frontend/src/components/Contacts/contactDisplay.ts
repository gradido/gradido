// AI-GENERATED — not an architecture reference

import type { Composer } from 'vue-i18n'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { memberAlias, memberKey } from '@/utils/gradidoAddress'

/** The member a contact row names, as contactListQuery delivers it (the booking row's shape). */
export type ContactUser = {
  gradidoID: string
  alias?: string
  communityUuid?: string | null
  communityName?: string | null
  [field: string]: unknown
}

/**
 * One row of contactListQuery. Handed off a booking row, a contact carries its `user` alone until
 * the lookup answers (useContactWindow.openMember): the window asks (`counted`) before it reads
 * the three figures.
 */
export type Contact = {
  user: ContactUser
  firstAt: string
  lastAt: string
  bookings: number
  origin?: string | null
  unreadChatMessages?: number
  chatPreview?: { unread?: boolean; [field: string]: unknown } | null
  homeCommunity?: boolean
  [field: string]: unknown
}

/** The two the builders below say things with: the caller's `useI18n()`. */
type Words = Pick<Composer, 't' | 'd'>

/**
 * One contact ready to draw: its key, the name the wallet gives it, and the face.
 *
 * Here rather than in each component for the two reasons the booking column gives: the
 * letters and the colour seed have to come from ONE call, or a later edit can leave them
 * describing different members; and `memberAvatarProps` reads a reactive store, so calling
 * it once per prop makes every list rebuild every data URI whenever any member's picture
 * changes. Shared by the column, the strip and the window, so those three cannot come to
 * name or draw a person differently.
 *
 * ⛔ `zoomable` is off by default, and that is not a performance choice. A zoomable avatar
 * renders a `<button>` and stops the click, so inside a tappable tile it swallows the tap
 * that was meant to open the contact window -- and only for members who happen to have a
 * portrait, which would make one circle behave two ways. Switch it on only where the
 * avatar stands OUTSIDE the tap target (the list row, the window), the way `ContactRow`
 * has it.
 */
export const contactDisplay = (contact: Contact, { zoomable = false } = {}) => {
  const base = memberAvatarProps(contact.user)
  return {
    contact,
    key: memberKey(contact.user),
    alias: memberAlias(contact.user.alias, contact.user.gradidoID),
    avatar: zoomable ? { ...base, ...avatarZoomBindings(contact.user, base) } : base,
  }
}

/** What `contactDisplay` makes of a contact: the shape `ContactTiles` is handed. */
export type ContactDisplayRow = ReturnType<typeof contactDisplay>

/** Between the parts of a contact's meta line, carrying its own spaces on both sides. */
export const CONTACT_META_SEPARATOR = ' · '

/**
 * "12 bookings · last on 24.08." -- how often, and how recently. One builder for the row
 * and the window, so the two cannot come to say it differently; the window puts "since"
 * in front of it with the same separator.
 *
 * `t` and `d` come from the caller's `useI18n()`: this file is not a setup scope.
 */
export const contactBookingsMeta = (contact: Contact, { t, d }: Words) =>
  [
    t('contacts.bookings', contact.bookings),
    t('contacts.last', { date: d(new Date(contact.lastAt), 'short') }),
  ].join(CONTACT_META_SEPARATOR)

/**
 * How the two of them became contacts, where it was not a booking -- '' where it was.
 *
 * ⛔ The keys written out, not built from the value (`contacts.origin.${value}`), for two
 * reasons. A server one version ahead could name an origin this wallet has no word for, and
 * a built key would put the raw string `contacts.origin.something_new` under somebody's
 * name; here an unknown origin says nothing instead. And the i18n lint counts only LITERAL
 * keys -- a key reached through a variable is reported as unused and eventually deleted.
 *
 * The values are the GraphQL enum `ContactOrigin` as it arrives over the wire. The wallet
 * does not import `shared`, so they are strings here, pinned by the specs on both sides.
 */
export const contactOriginLine = (contact: Contact, { t }: Pick<Words, 't'>) => {
  switch (contact.origin) {
    case 'REFERRER':
      return t('contacts.origin.referrer')
    case 'ARRIVAL':
      return t('contacts.origin.arrival')
    default:
      return ''
  }
}

/**
 * The line under a contact's name: how often and how recently, or -- where there has been
 * nothing to count yet -- what made the two of them contacts.
 *
 * ⛔ The branch stands BEFORE the plural rule, and that is the whole reason this builder
 * exists next to `contactBookingsMeta`. Somebody who came here over this member is a
 * contact from that moment, with no bookings behind them: handed to the plural rule that
 * number writes "0 bookings · last on …" under their name, which is both true and the
 * wrong thing to say to somebody who has just arrived.
 *
 * Where there are bookings the line is exactly what it always was, origin or no origin.
 * The window under the name shows both (ContactWindow); a row has one line.
 */
export const contactMeta = (contact: Contact, { t, d }: Words) =>
  contact.bookings > 0 ? contactBookingsMeta(contact, { t, d }) : contactOriginLine(contact, { t })
