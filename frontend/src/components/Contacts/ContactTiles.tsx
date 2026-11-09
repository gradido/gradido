// AI-GENERATED — not an architecture reference
/**
 * A row of faces, sideways: the favourites, in the column and on the phone strip.
 *
 * It holds no state and asks nothing -- it is handed rows that `contactDisplay` has already
 * prepared and says which one was tapped. Both places that show favourites use it, so the
 * two cannot come to draw them differently.
 */

import { defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import AppAvatar from '@/components/AppAvatar.vue'
import ChatUnreadDot from '@/components/Chat/ChatUnreadDot.vue'
import type { ContactDisplayRow } from '@/components/Contacts/contactDisplay'
import { LIST_AVATAR_SIZE } from '@/constants'
import MdiChevronRight from '~icons/mdi/chevron-right'
import classes from './ContactTiles.module.scss'

export const ContactTiles = defineComponent({
  name: 'ContactTiles',
  props: {
    /** Rows from `contactDisplay`: `{ contact, key, alias, avatar }`. */
    rows: { type: Array as PropType<ContactDisplayRow[]>, required: true },
    /** Whether the row ends with a tile leading to the full list. */
    withAllLink: { type: Boolean, default: false },
  },
  emits: ['open'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const face = `${LIST_AVATAR_SIZE}px`

    return () => (
      <div
        class={['contact-tiles', classes['contact-tiles']]}
        style={{ '--contact-tile-face': face }}
        data-test='contact-tiles'
      >
        {props.rows.map((row) => (
          <button
            key={row.key}
            type='button'
            class={['contact-tile', classes['contact-tile']]}
            data-test={`contact-tile-${row.contact.user.gradidoID}`}
            onClick={() => emit('open', row.contact)}
          >
            {/* ⛔ Not zoomable here (contactDisplay's default). A zoomable avatar renders its
                own button and stops the click, so the face -- most of the tile -- would open
                the picture instead of the person, and only for members who have one. */}
            <AppAvatar size={LIST_AVATAR_SIZE} color='#fff' {...row.avatar} />
            <span class={['contact-tile-name', classes['contact-tile-name']]}>{row.alias}</span>
            {/* The gold dot while a message from them waits unread: drawn on the face's upper
                corner, as the mark in the menu sits on its symbol, but standing AFTER the name in
                the button, so a screen reader says who first and then "2 new messages". */}
            <ChatUnreadDot
              count={row.contact.unreadChatMessages}
              class={['contact-tile-dot', classes['contact-tile-dot']]}
            />
          </button>
        ))}

        {/* The way to everybody else. On the phone strip this is the only route to the full
            list, so it stands whether or not there is anybody in the row -- see ContactsStrip,
            which renders these tiles even when the row itself is empty. */}
        {props.withAllLink ? (
          <RouterLink
            to='/contacts'
            class={['contact-tile', classes['contact-tile']]}
            data-test='contact-tiles-all'
          >
            {/* The size of the faces beside it, from the same constant: a circle of its own size
                would stand out of line at the end of the row. */}
            <span
              class={['contact-tile-more', classes['contact-tile-more']]}
              style={{ width: face, height: face }}
              aria-hidden='true'
            >
              <MdiChevronRight />
            </span>
            <span class={['contact-tile-name', classes['contact-tile-name']]}>
              {t('contacts.allShort')}
            </span>
          </RouterLink>
        ) : null}
      </div>
    )
  },
})
