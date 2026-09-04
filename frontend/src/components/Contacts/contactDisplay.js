// AI-GENERATED — not an architecture reference

import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { memberAlias, memberKey } from '@/utils/gradidoAddress'

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
 *
 * @param {{user: object}} contact one row of contactListQuery
 * @param {{zoomable?: boolean}} options
 */
export const contactDisplay = (contact, { zoomable = false } = {}) => {
  const base = memberAvatarProps(contact.user)
  return {
    contact,
    key: memberKey(contact.user),
    alias: memberAlias(contact.user.alias, contact.user.gradidoID),
    avatar: zoomable ? { ...base, ...avatarZoomBindings(contact.user, base) } : base,
  }
}

/** Between the parts of a contact's meta line, carrying its own spaces on both sides. */
export const CONTACT_META_SEPARATOR = ' · '

/**
 * "12 bookings · last on 24.08." -- how often, and how recently. One builder for the row
 * and the window, so the two cannot come to say it differently; the window puts "since"
 * in front of it with the same separator.
 *
 * `t` and `d` come from the caller's `useI18n()`: this file is not a setup scope.
 */
export const contactBookingsMeta = (contact, { t, d }) =>
  [
    t('contacts.bookings', contact.bookings),
    t('contacts.last', { date: d(new Date(contact.lastAt), 'short') }),
  ].join(CONTACT_META_SEPARATOR)
